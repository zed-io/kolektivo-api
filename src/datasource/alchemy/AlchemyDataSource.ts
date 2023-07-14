import { BaseDataSource } from '../BaseDataSource'
import { TransactionType, isDefined } from '../../transaction/TransactionType'
import { AlchemyTransaction } from '../../transaction/alchemy/AlchemyTransaction'
import {
  Alchemy,
  AssetTransfersCategory,
  AssetTransfersWithMetadataResult,
  Network,
} from 'alchemy-sdk'
import { PageInfo, Chain, AlchemyChain, TokenTransactionV2 } from '../../types'
import {
  ClassifiedTransaction,
  TransactionClassifier,
} from '../../transaction/TransactionClassifier'
import {
  NftReceived,
  NftSent,
  TokenReceived,
  TokenSent,
  TokenSwap,
} from '../../events/alchemy'
import { logger } from '../../logger'
import { RESTDataSource } from 'apollo-datasource-rest'

type ClassifiedAlchemyTransaction = ClassifiedTransaction<
  AlchemyTransaction,
  TransactionType<AlchemyTransaction>
>

const TRANSFER_CATEGORIES = [
  AssetTransfersCategory.ERC721,
  AssetTransfersCategory.SPECIALNFT,
  AssetTransfersCategory.ERC20,
  AssetTransfersCategory.INTERNAL,
  AssetTransfersCategory.EXTERNAL,
]

const MAX_ALCHEMY_RESULTS = 500
export const MAX_RETURN_RESULTS = 25

export function isAlchemyChain(chain: Chain): chain is AlchemyChain {
  return Object.values(AlchemyChain).includes(chain as AlchemyChain)
}

export interface AlchemyAssetTransfers {
  transfersFrom: AssetTransfersWithMetadataResult[]
  transfersTo: AssetTransfersWithMetadataResult[]
}

export class AlchemyDataSourceManager extends RESTDataSource {
  alchemyNetworkMap: Record<AlchemyChain, Network>
  alchemyApiKeys: Record<AlchemyChain, string>

  constructor({
    alchemyNetworkMap,
    alchemyApiKeys,
  }: {
    alchemyNetworkMap: Record<AlchemyChain, Network>
    alchemyApiKeys: Record<AlchemyChain, string>
  }) {
    super()
    this.alchemyNetworkMap = alchemyNetworkMap
    this.alchemyApiKeys = alchemyApiKeys
  }

  getDataSource(chain: AlchemyChain): AlchemyDataSource {
    return new AlchemyDataSource({
      network: this.alchemyNetworkMap[chain],
      apiKey: this.alchemyApiKeys[chain],
      chain,
    })
  }
}

export class AlchemyDataSource extends BaseDataSource<
  AlchemyTransaction,
  TransactionType<AlchemyTransaction>
> {
  network: Network
  alchemyClient: Alchemy
  chain: AlchemyChain

  constructor({
    network,
    apiKey,
    chain,
  }: {
    network: Network
    apiKey: string
    chain: AlchemyChain
  }) {
    super()
    this.network = network
    this.chain = chain
    this.alchemyClient = new Alchemy({
      apiKey,
      network,
    })
  }

  /**
   * Fetch all recent transaction data for an address.
   *
   * The fetching process consists of a number of steps, designed to minimize requests to Alchemy
   * while handling pagination. Roughly, these steps are as follows:
   * 1. Fetch raw transfers to and from user's address
   * 2. Collect transfers together that correspond to a single blockchain transaction
   * 3. Sort and filter these merged transfers
   * 4. Augment the merged transfers with transaction receipt data, which contain fee information
   * 5. Determine pagination parameters based on intermediate results
   *
   * The cursor returned is the minimum block # among returned transactions. If an afterCursor is
   * provided in the request, it is treated as a block number; only transactions from blocks prior
   * to the afterCursor block will be returned in the request.
   */
  async fetchRawTxs(
    address: string,
    afterCursor?: string,
  ): Promise<{ transactions: AlchemyTransaction[]; pageInfo: PageInfo }> {
    const { transfers, alchemyHasNextPage } = await this.fetchAlchemyTransfers(
      address,
      afterCursor,
    )
    const mergedTxs = this.mergeTxs(transfers)
    const sortedTxs = this.sortAndFilterTxs(mergedTxs)
    const alchemyTransactions = await this.constructTransactions(sortedTxs)

    const minBlockNum = sortedTxs[sortedTxs.length - 1].blockNum
    // There are more results if Alchemy says so, OR we've reached the end of Alchemy results
    // but have truncated them internally.
    const hasNextPage =
      alchemyHasNextPage || sortedTxs.length < mergedTxs.length
    return {
      transactions: alchemyTransactions,
      pageInfo: {
        hasPreviousPage: !!afterCursor, // If an afterCursor is given, it implies previous results exist
        hasNextPage,
        startCursor: afterCursor,
        endCursor: hasNextPage ? minBlockNum.toString() : undefined,
      },
    }
  }

  /**
   * Constructs AlchemyTransaction objects from asset transfer information by
   * supplementing with transaction receipts in order to gather fee-related information.
   */
  async constructTransactions(
    transactions: { txHash: string; transfers: AlchemyAssetTransfers }[],
  ): Promise<AlchemyTransaction[]> {
    const alchemyTransactions = await Promise.all(
      transactions.map(async (tx) => {
        try {
          // TODO(optimization): We discard some number of transactions due to classification ineligibility;
          // the associated receipts are wasted requests; try fetching receipts lazily. Since receipts are
          // available through any JSON RPC node, we could alternatively use a non-Alchemy service to fetch these
          // to work around rate-limiting.
          const txReceipt = await this.alchemyClient.core.getTransactionReceipt(
            tx.txHash,
          )
          if (!txReceipt) {
            throw new Error(`transaction receipt null for hash: ${tx.txHash}`)
          }
          return new AlchemyTransaction({
            transfersFrom: tx.transfers.transfersFrom,
            transfersTo: tx.transfers.transfersTo,
            txReceipt,
          })
        } catch (error) {
          logger.warn({
            type: 'ERROR_FETCHING_ALCHEMY_RECEIPT',
            transaction: JSON.stringify(tx),
            error,
          })
        }
      }),
    )
    return alchemyTransactions.filter(isDefined)
  }

  /**
   * Sorts the partial transaction list by date, most-recent to least-recent, and
   * truncates all but the MAX_RETURN_RESULT most recent entries. Augments transaction
   * objects with parsed block number for further processing.
   */
  sortAndFilterTxs(
    transactions: { txHash: string; transfers: AlchemyAssetTransfers }[],
  ): {
    txHash: string
    transfers: AlchemyAssetTransfers
    blockNum: number
  }[] {
    const getBlockNum = (transaction: AlchemyAssetTransfers): number => {
      return transaction.transfersFrom.length
        ? Number(transaction.transfersFrom[0].blockNum)
        : Number(transaction.transfersTo[0].blockNum)
    }
    const txsWithBlockNums = transactions.map((tx) => {
      return { ...tx, blockNum: getBlockNum(tx.transfers) }
    })
    txsWithBlockNums.sort((tx1, tx2) => tx2.blockNum - tx1.blockNum)
    return txsWithBlockNums.slice(0, MAX_RETURN_RESULTS)
  }

  /**
   * Fetches pages of to and from transfers from Alchemy and returns them,
   * alongside information on whether or not further pages are available for
   * either transfer type. Throws on any fetch error.
   */
  async fetchAlchemyTransfers(
    address: string,
    toBlock?: string,
  ): Promise<{
    transfers: AlchemyAssetTransfers
    alchemyHasNextPage: boolean
  }> {
    try {
      const [transfersFrom, transfersTo] = await Promise.all([
        this.alchemyClient.core.getAssetTransfers({
          toBlock,
          maxCount: MAX_ALCHEMY_RESULTS,
          fromAddress: address,
          excludeZeroValue: true,
          withMetadata: true,
          category: TRANSFER_CATEGORIES,
        }),
        this.alchemyClient.core.getAssetTransfers({
          toBlock,
          maxCount: MAX_ALCHEMY_RESULTS,
          toAddress: address,
          excludeZeroValue: true,
          withMetadata: true,
          category: TRANSFER_CATEGORIES,
        }),
      ])
      return {
        transfers: {
          transfersFrom: transfersFrom.transfers,
          transfersTo: transfersTo.transfers,
        },
        alchemyHasNextPage: !!transfersFrom.pageKey || !!transfersTo.pageKey,
      }
    } catch (error) {
      logger.error({
        type: 'ERROR_FETCHING_ALCHEMY_TRANSFERS',
        error,
      })
      throw error
    }
  }

  /**
   * Given lists of arbitrary transfers to and from a particular address,
   * merges them into "transaction" objects, grouping asset transfers associated
   * with the same transaction hash. Returns list of objects containing transaction
   * hash alongside merged transfer objects.
   */
  mergeTxs(transfers: AlchemyAssetTransfers): {
    txHash: string
    transfers: AlchemyAssetTransfers
  }[] {
    const transactions: Record<string, AlchemyAssetTransfers> = {}

    for (const transferFrom of transfers.transfersFrom) {
      if (transferFrom.hash in transactions) {
        transactions[transferFrom.hash].transfersFrom.push(transferFrom)
      } else {
        transactions[transferFrom.hash] = {
          transfersFrom: [transferFrom],
          transfersTo: [],
        }
      }
    }

    for (const transferTo of transfers.transfersTo) {
      if (transferTo.hash in transactions) {
        transactions[transferTo.hash].transfersTo.push(transferTo)
      } else {
        transactions[transferTo.hash] = {
          transfersFrom: [],
          transfersTo: [transferTo],
        }
      }
    }
    return Object.entries(transactions).map(([txHash, transfers]) => {
      return { txHash, transfers }
    })
  }

  classifyTxs(
    address: string,
    txs: AlchemyTransaction[],
    _valoraVersion?: string,
  ): ClassifiedAlchemyTransaction[] {
    const context = { userAddress: address, chain: this.chain }
    const classifier = new TransactionClassifier<
      AlchemyTransaction,
      TransactionType<AlchemyTransaction>
    >([
      new NftReceived(context),
      new NftSent(context),
      new TokenReceived(context),
      new TokenSent(context),
      new TokenSwap(context),
    ])

    const classifiedTxs: ClassifiedAlchemyTransaction[] = []

    for (const transaction of txs) {
      try {
        classifiedTxs.push(classifier.classify(transaction))
      } catch (err) {
        logger.warn({
          err,
          txReceipt: transaction.txReceipt,
          type: 'ERROR_MAPPING_ALCHEMY_TRANSACTION',
        })
      }
    }

    return classifiedTxs
  }

  serializeTxs(
    _classifiedTxs: ClassifiedAlchemyTransaction[],
  ): TokenTransactionV2[] {
    throw new Error('serializeTxs not implemented!')
  }
}
