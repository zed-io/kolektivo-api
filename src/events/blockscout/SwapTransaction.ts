import { isSwap } from '../../transaction/TransfersUtils'
import { EventBuilder } from '../../helpers/EventBuilder'
import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'
import { TokenTransactionTypeV2, TokenExchangeV2 } from '../../types'
import {
  getTransferTo,
  getTransferFrom,
} from '../../transaction/TransfersUtils'

export class SwapTransaction extends BlockscoutTransactionType {
  public isAggregatable = false

  matches(transaction: BlockscoutTransaction): boolean {
    return isSwap(transaction.transfers, this.context.userAddress)
  }

  async getEvent(transaction: BlockscoutTransaction): Promise<TokenExchangeV2> {
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
}
