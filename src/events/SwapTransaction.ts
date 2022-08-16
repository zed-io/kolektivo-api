import { isSwap } from '../transaction/TransfersUtils'
import { EventBuilder } from '../helpers/EventBuilder'
import { Transaction } from '../transaction/Transaction'
import { TransactionType } from '../transaction/TransactionType'
import { TokenTransactionTypeV2 } from '../resolvers'
import { getTransferTo, getTransferFrom } from '../transaction/TransfersUtils'

export class SwapTransaction extends TransactionType {
  matches(transaction: Transaction): boolean {
    return isSwap(transaction.transfers, this.context.userAddress)
  }

  async getEvent(transaction: Transaction) {
    const inTransfer = getTransferTo(
      transaction.transfers,
      this.context.userAddress,
    )
    const outTransfer = getTransferFrom(
      transaction.transfers,
      this.context.userAddress,
    )

    if (!inTransfer) {
      throw new Error('Transfer to wallet address not found.')
    }

    if (!outTransfer) {
      throw new Error('Transfer from wallet address not found.')
    }

    return await EventBuilder.exchangeEvent(
      transaction,
      TokenTransactionTypeV2.SWAP_TRANSACTION,
      inTransfer,
      outTransfer,
      transaction.fees,
    )
  }

  isAggregatable(): boolean {
    return false
  }
}
