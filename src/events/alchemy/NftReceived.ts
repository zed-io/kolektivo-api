import { NftTransferV2, TokenTransactionTypeV2 } from '../../types'
import { TransactionType } from '../../transaction/TransactionType'
import { AlchemyTransaction } from '../../transaction/alchemy/AlchemyTransaction'
import { EventBuilder } from '../../helpers/EventBuilder'

export function hasTokenIdAndTokenAddress(idAndAddress: {
  tokenId: string | null
  tokenAddress: string | null
}): idAndAddress is { tokenId: string; tokenAddress: string } {
  return !!(idAndAddress.tokenId && idAndAddress.tokenAddress)
}

export class NftReceived extends TransactionType<AlchemyTransaction> {
  matches(transaction: AlchemyTransaction): boolean {
    return (
      transaction.getNftTransfersTo().length >
      transaction.getNftTransfersFrom().length
    )
  }

  async getEvent(transaction: AlchemyTransaction): Promise<NftTransferV2> {
    const nftTransfersTo = transaction.getNftTransfersTo()

    const nfts = await EventBuilder.getNfts(
      nftTransfersTo
        .map(({ tokenId, rawContract: { address: tokenAddress } }) => ({
          tokenId,
          tokenAddress,
        }))
        .filter(hasTokenIdAndTokenAddress),
      this.context.chain,
    )

    const timestamp = new Date(
      nftTransfersTo[0].metadata.blockTimestamp,
    ).getTime()
    return {
      type: TokenTransactionTypeV2.NFT_RECEIVED,
      transactionHash: transaction.txReceipt.transactionHash,
      timestamp,
      block: transaction.getBlockNum(),
      nfts,
      fees: [], // TODO add fees once wallet can handle fees paid in native currency https://linear.app/valora/issue/ACT-840/display-fees-correctly-when-paid-in-native-token
    }
  }
}
