import { EventBuilder } from '../helpers/EventBuilder'
import { TokenTransactionTypeV2 } from '../resolvers'
import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'

export class NftSent extends TransactionType {
  matches(transaction: Transaction): boolean {
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

    return numNftsSent > 0 && numNftsSent > numNftsReceived
  }

  async getEvent(transaction: Transaction) {
    return await EventBuilder.nftTransferEvent(
      this.context.userAddress.toLowerCase(),
      transaction,
      TokenTransactionTypeV2.NFT_SENT,
    )
  }

  isAggregatable(): boolean {
    return false
  }
}
