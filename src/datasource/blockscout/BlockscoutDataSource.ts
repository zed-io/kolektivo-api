import { performance } from 'perf_hooks'
import { BaseDataSource } from '../BaseDataSource'
import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'
import {
  ClassifiedTransaction,
  TransactionClassifier,
} from '../../transaction/TransactionClassifier'
import { BlockscoutChain, BlockscoutTokenTransfer, PageInfo } from '../../types'
import { BLOCKSCOUT_API } from '../../config'
import { compare } from 'compare-versions'
import tokenInfoCache from '../../helpers/TokenInfoCache'
import { NftReceived } from '../../events/blockscout/NftReceived'
import { NftSent } from '../../events/blockscout/NftSent'
import {
  ContractCall,
  EscrowSent,
  TokenSent,
  EscrowReceived,
  TokenReceived,
  ExchangeCeloToToken,
  ExchangeTokenToCelo,
  Any,
} from '../../events/blockscout'
import { EscrowContractCall } from '../../events/blockscout/EscrowContractCall'
import { ExchangeContractCall } from '../../events/blockscout/ExchangeContractCall'
import { SwapTransaction } from '../../events/blockscout/SwapTransaction'
import { isDefined } from '../../transaction/TransactionType'
import { BlockscoutTransactionAggregator } from '../../transaction/blockscout/BlockscoutTransactionAggregator'
import { getContractAddresses } from '../../utils'
import { metrics } from '../../metrics'

const MAX_RESULTS_PER_QUERY = 25
const MAX_TRANSFERS_PER_TRANSACTIONS = 40

const BLOCKSCOUT_QUERY = `
query Transfers($address: AddressHash!, $afterCursor: String) {
  # TXs related to cUSD or cGLD transfers
  tokenTransferTxs(addressHash: $address, first: ${MAX_RESULTS_PER_QUERY}, after: $afterCursor) {
    edges {
      node {
        transactionHash
        blockNumber
        timestamp
        gasPrice
        gasUsed
        feeToken
        gatewayFee
        gatewayFeeRecipient
        input
        # Transfers associated with the TX
        tokenTransfer(first: ${MAX_TRANSFERS_PER_TRANSACTIONS}) {
          edges {
            node {
              fromAddressHash
              toAddressHash
              fromAccountHash
              toAccountHash
              value
              tokenAddress
              tokenType
              tokenId
            }
          }
        }
      }
    }
    pageInfo {
      startCursor
      endCursor
      hasNextPage
      hasPreviousPage
    }
  }
}
`

export class BlockscoutDataSource extends BaseDataSource<
  BlockscoutTransaction,
  BlockscoutTransactionType
> {
  constructor() {
    super()
    this.baseURL = `${BLOCKSCOUT_API}/graphql`
  }

  async fetchRawTxs(
    address: string,
    afterCursor?: string | undefined,
  ): Promise<{ transactions: BlockscoutTransaction[]; pageInfo: PageInfo }> {
    // ensure contract addresses are loaded from contract kit
    const t0 = performance.now()

    await getContractAddresses()

    const response = await this.post('', {
      query: BLOCKSCOUT_QUERY,
      variables: { address: address.toLowerCase(), afterCursor },
    })

    const pageInfo = response.data.tokenTransferTxs.pageInfo

    const transactions = response.data.tokenTransferTxs.edges.map(
      ({ node }: any) => {
        const { tokenTransfer, ...partialTransferTx } = node
        const tokenTransfers = node.tokenTransfer.edges.map(
          (edge: any) => edge.node,
        )

        return new BlockscoutTransaction(partialTransferTx, tokenTransfers)
      },
    )

    // Record time at end of execution
    const t1 = performance.now()
    metrics.setRawTokenDuration(t1 - t0)

    return { transactions, pageInfo }
  }

  classifyTxs(
    address: string,
    txs: BlockscoutTransaction[],
    valoraVersion?: string | undefined,
  ): ClassifiedTransaction<BlockscoutTransaction, BlockscoutTransactionType>[] {
    const userAddress = address.toLowerCase()

    // For now, when you create a new transaction type other than TokenTransferV2, TokenExchangeV2
    // You should do version check to take care of backward compatibility with
    // wallet client.

    const shouldIncludeNftTransactions = compare(
      valoraVersion ?? '0.0.0',
      '1.38.0',
      '>=',
    )
    const shouldIncludeSwapTransactions = compare(
      valoraVersion ?? '0.0.0',
      '1.39.0',
      '>=',
    )

    const supportedTokens = new Set(tokenInfoCache.getTokenAddresses())

    const filteredTxs = txs.filter((tx: BlockscoutTransaction) => {
      return tx.transfers.every((transfer: BlockscoutTokenTransfer) => {
        return (
          supportedTokens.has(transfer.tokenAddress.toLowerCase()) ||
          (shouldIncludeNftTransactions && transfer.tokenType === 'ERC-721')
        )
      })
    })

    const context = { userAddress, chain: BlockscoutChain.Celo }

    // Order is important when classifying transactions.
    // Think that below is like case statement.
    const transactionClassifier = new TransactionClassifier<
      BlockscoutTransaction,
      BlockscoutTransactionType
    >(
      [
        new ExchangeContractCall(context),
        new EscrowContractCall(context),
        new ContractCall(context),
        new EscrowSent(context),
        shouldIncludeNftTransactions ? new NftReceived(context) : undefined,
        shouldIncludeNftTransactions ? new NftSent(context) : undefined,
        new TokenSent(context),
        new EscrowReceived(context),
        new TokenReceived(context),
        shouldIncludeSwapTransactions
          ? new SwapTransaction(context)
          : undefined,
        new ExchangeCeloToToken(context),
        new ExchangeTokenToCelo(context),
        new Any(context),
      ].filter(isDefined),
    )

    const classifiedTransactions = filteredTxs.map((transaction) =>
      transactionClassifier.classify(transaction),
    )

    return BlockscoutTransactionAggregator.aggregate(classifiedTransactions)
  }
}
