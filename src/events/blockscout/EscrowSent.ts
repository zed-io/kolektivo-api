import {
  containsTransferTo,
  getTransferTo,
} from '../../transaction/TransfersUtils'
import { EventBuilder } from '../../helpers/EventBuilder'
import { TokenTransactionTypeV2, TokenTransferV2 } from '../../types'
import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'
import { Contracts } from '../../utils'

export class EscrowSent extends BlockscoutTransactionType {
  public isAggregatable = false

  matches(transaction: BlockscoutTransaction): boolean {
    return (
      transaction.transfers.length === 1 &&
      containsTransferTo(transaction.transfers, Contracts.Escrow)
    )
  }

  async getEvent(transaction: BlockscoutTransaction): Promise<TokenTransferV2> {
    const transfer = getTransferTo(transaction.transfers, Contracts.Escrow)

    if (!transfer) {
      throw new Error('Transfer to Escrow not found.')
    }

    return await EventBuilder.transferEvent(
      transaction,
      transfer,
      TokenTransactionTypeV2.INVITE_SENT,
      transfer.toAddressHash,
      transfer.toAccountHash,
      transaction.fees,
    )
  }
}
