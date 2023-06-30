import { EventBuilder } from '../../helpers/EventBuilder'
import { TokenTransactionTypeV2, NftTransferV2 } from '../../types'
import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'

export class NftReceived extends BlockscoutTransactionType {
  public isAggregatable = false

  matches(transaction: BlockscoutTransaction): boolean {
    let numNftsSent = 0
    let numNftsReceived = 0
    const lowerCasedUserAddress = this.context.userAddress.toLowerCase()

    for (const transfer of transaction.transfers) {
      if (transfer.tokenType === 'ERC-721') {
        if (transfer.toAddressHash.toLowerCase() === lowerCasedUserAddress) {
          numNftsReceived++
        }

        if (transfer.fromAddressHash.toLowerCase() === lowerCasedUserAddress) {
          numNftsSent++
        }
      }
    }

    return numNftsReceived > 0 && numNftsReceived >= numNftsSent
  }

  async getEvent(transaction: BlockscoutTransaction): Promise<NftTransferV2> {
    return await EventBuilder.nftTransferEvent(
      transaction,
      this.context.userAddress.toLowerCase(),
      TokenTransactionTypeV2.NFT_RECEIVED,
      this.context.chain,
    )
  }
}
