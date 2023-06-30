import { BigNumber } from 'bignumber.js'
import {
  AlchemyChain,
  BlockscoutTokenTransfer,
  Chain,
  FeeV2,
  Nft,
  NftTransferV2,
  TokenExchangeV2,
  TokenTransactionTypeV2,
  TokenTransferV2,
} from '../types'
import {
  BlockscoutTransaction,
  Fee,
} from '../transaction/blockscout/BlockscoutTransaction'
import { ContractAddresses, getContractAddresses, WEI_PER_GOLD } from '../utils'
import knownAddressesCache from './KnownAddressesCache'
import tokenInfoCache from './TokenInfoCache'
import fetch from 'cross-fetch'
import { GET_NFT_API_URL } from '../config'
import { logger } from '../logger'
import asyncPool from 'tiny-async-pool'
import { isDefined } from '../transaction/TransactionType'

export const ChainToNftNetwork: Record<Chain | AlchemyChain, string> = {
  // maps Chain to network name used in nft-indexer
  [Chain.Celo]: 'celo',
  [Chain.Ethereum]: 'ethereum',
}

export class EventBuilder {
  static contractAddresses: ContractAddresses

  static async loadContractAddresses() {
    EventBuilder.contractAddresses = await getContractAddresses()
  }

  static async transferEvent(
    transaction: BlockscoutTransaction,
    transfer: BlockscoutTokenTransfer,
    eventType: TokenTransactionTypeV2,
    address: string,
    account?: string,
    fees?: Fee[],
  ): Promise<TokenTransferV2> {
    const transactionHash = transaction.transactionHash
    const block = transaction.blockNumber
    const timestamp = transaction.timestamp
    const comment = transaction.comment

    const isOutgoingTransaction = fees !== undefined && fees.length > 0

    const { name, imageUrl } = knownAddressesCache.getDisplayInfoFor(address)

    return {
      type: eventType,
      timestamp,
      block,
      transactionHash,
      address,
      account: account ? account : address,
      amount: {
        // Signed amount relative to the account currency
        value: new BigNumber(transfer.value)
          .multipliedBy(isOutgoingTransaction ? -1 : 1)
          .dividedBy(this.getWeiForToken(transfer.tokenAddress))
          .toString(),
        tokenAddress: transfer.tokenAddress,
        timestamp,
      },
      metadata: {
        comment,
        title: name,
        image: imageUrl,
      },
      fees: fees
        ? await EventBuilder.formatFees(fees, transaction.timestamp)
        : [],
    }
  }

  static async nftTransferEvent(
    transaction: BlockscoutTransaction,
    address: string | null,
    eventType: TokenTransactionTypeV2,
    chain: Chain | AlchemyChain,
    fees?: Fee[],
  ): Promise<NftTransferV2> {
    const transactionHash = transaction.transactionHash
    const block = transaction.blockNumber
    const timestamp = transaction.timestamp

    // Top check if the event type is valid
    if (
      eventType !== TokenTransactionTypeV2.NFT_SENT &&
      eventType !== TokenTransactionTypeV2.NFT_RECEIVED
    ) {
      throw new Error(`Invalid event type ${eventType}`)
    }

    // Filter by address based on the event eventType - fromAddress for sent, toAddress for received
    const filterFn =
      eventType === TokenTransactionTypeV2.NFT_SENT
        ? (transfer: { fromAddressHash: string | null }) =>
            transfer.fromAddressHash === address
        : (transfer: { toAddressHash: string | null }) =>
            transfer.toAddressHash === address

    const filteredTransfers = transaction.transfers
      .filter(filterFn)
      .filter((transfer) => transfer.tokenAddress && transfer.tokenId)

    const nfts = await EventBuilder.getNfts(filteredTransfers, chain)
    return {
      type: eventType,
      timestamp,
      block,
      transactionHash,
      nfts,
      ...(fees && {
        fees: await EventBuilder.formatFees(fees, transaction.timestamp),
      }),
    }
  }

  static async getNfts(
    addressAndIds: { tokenAddress: string; tokenId: string }[],
    chain: Chain | AlchemyChain,
  ): Promise<Nft[]> {
    return (
      await asyncPool(5, addressAndIds, async ({ tokenAddress, tokenId }) => {
        try {
          return await EventBuilder.getNft({
            contractAddress: tokenAddress,
            tokenId,
            chain,
          })
        } catch (err) {
          logger.error({
            message: `Error fetching NFT ${tokenAddress}:${tokenId}`,
            err,
          })
        }
      })
    ).filter(isDefined)
  }

  static async exchangeEvent(
    transaction: BlockscoutTransaction,
    eventType: TokenTransactionTypeV2,
    inTransfer: BlockscoutTokenTransfer,
    outTransfer: BlockscoutTokenTransfer,
    fees?: Fee[],
  ): Promise<TokenExchangeV2> {
    const transactionHash = transaction.transactionHash
    const block = transaction.blockNumber
    const timestamp = transaction.timestamp

    return {
      type: eventType,
      timestamp,
      block,
      transactionHash,
      inAmount: {
        value: new BigNumber(inTransfer!.value)
          .dividedBy(this.getWeiForToken(inTransfer.tokenAddress))
          .toString(),
        tokenAddress: inTransfer.tokenAddress,
        timestamp,
      },
      outAmount: {
        value: new BigNumber(outTransfer!.value)
          .dividedBy(this.getWeiForToken(outTransfer.tokenAddress))
          .toString(),
        tokenAddress: outTransfer.tokenAddress,
        timestamp,
      },
      fees: fees
        ? await EventBuilder.formatFees(fees, transaction.timestamp)
        : [],
    }
  }

  static async formatFees(fees: Fee[], timestamp: number): Promise<FeeV2[]> {
    return await Promise.all(
      fees.map(async (fee) => ({
        type: fee.type,
        amount: {
          tokenAddress: tokenInfoCache.tokenInfoBySymbol(fee.currencyCode)!
            .address,
          timestamp,
          value: fee.value.dividedBy(WEI_PER_GOLD).toFixed(),
        },
      })),
    )
  }

  static getWeiForToken(address: string) {
    return Math.pow(10, tokenInfoCache.getDecimalsForToken(address))
  }

  static async getNft({
    contractAddress,
    tokenId,
    chain,
  }: {
    contractAddress: string
    tokenId: string
    chain: Chain | AlchemyChain
  }): Promise<Nft> {
    try {
      const url = `${GET_NFT_API_URL}?contractAddress=${contractAddress}&tokenId=${tokenId}&network=${ChainToNftNetwork[chain]}`
      const response = await fetch(url)
      if (!response.ok)
        throw new Error(
          `Received response code ${response.status} from ${GET_NFT_API_URL}`,
        )
      const { result } = await response.json()
      const { tokenUri, metadata, ownerAddress, media } = result
      return {
        tokenId,
        contractAddress,
        ownerAddress,
        tokenUri,
        metadata,
        media,
      }
    } catch (err) {
      logger.warn({
        msg: `Error: Could not get Nft details - contractAddress: '${contractAddress}' tokenId: '${tokenId}'`,
        err,
      })
      throw err
    }
  }
}
