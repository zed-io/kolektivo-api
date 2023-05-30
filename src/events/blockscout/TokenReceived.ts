import {
  containsTransferTo,
  getTransferTo,
} from '../../transaction/TransfersUtils'
import { EventBuilder } from '../../helpers/EventBuilder'
import { TokenTransactionTypeV2, TokenTransferV2 } from '../../types'
import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'

export class TokenReceived extends BlockscoutTransactionType {
  public isAggregatable = false

  matches(transaction: BlockscoutTransaction): boolean {
    return (
      transaction.transfers.length === 1 &&
      containsTransferTo(transaction.transfers, this.context.userAddress)
    )
  }

  async getEvent(transaction: BlockscoutTransaction): Promise<TokenTransferV2> {
    const transfer = getTransferTo(
      transaction.transfers,
      this.context.userAddress,
    )

    if (!transfer) {
      throw new Error('Transfer to the user not found.')
    }

    return await EventBuilder.transferEvent(
      transaction,
      transfer,
      TokenTransactionTypeV2.RECEIVED,
      transfer.fromAddressHash,
      transfer.fromAccountHash,
    )
  }
}
