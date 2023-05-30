import {
  containsTransferFrom,
  getTransferFrom,
} from '../../transaction/TransfersUtils'
import { EventBuilder } from '../../helpers/EventBuilder'
import { TokenTransactionTypeV2, TokenTransferV2 } from '../../types'
import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'

export class TokenSent extends BlockscoutTransactionType {
  public isAggregatable = false

  matches(transaction: BlockscoutTransaction): boolean {
    return (
      transaction.transfers.length === 1 &&
      containsTransferFrom(transaction.transfers, this.context.userAddress)
    )
  }

  async getEvent(transaction: BlockscoutTransaction): Promise<TokenTransferV2> {
    const transfer = getTransferFrom(
      transaction.transfers,
      this.context.userAddress,
    )

    if (!transfer) {
      throw new Error('Transfer from the user not found.')
    }

    return await EventBuilder.transferEvent(
      transaction,
      transfer,
      TokenTransactionTypeV2.SENT,
      transfer.toAddressHash,
      transfer.toAccountHash,
      transaction.fees,
    )
  }
}
