import {
  containsTransferTo,
  containsTransferFrom,
  containsBurnedTokenTransfer,
  getTransferTo,
  getTransferFrom,
} from '../../transaction/TransfersUtils'
import { EventBuilder } from '../../helpers/EventBuilder'
import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'
import { Contracts } from '../../utils'
import { TokenTransactionTypeV2, TokenExchangeV2 } from '../../types'

export class ExchangeTokenToCelo extends BlockscoutTransactionType {
  public isAggregatable = false

  matches(transaction: BlockscoutTransaction): boolean {
    return (
      transaction.transfers.length === 3 &&
      containsTransferFrom(transaction.transfers, Contracts.Reserve) &&
      (containsTransferTo(transaction.transfers, Contracts.Exchange) ||
        containsTransferTo(transaction.transfers, Contracts.ExchangeEUR) ||
        containsTransferTo(transaction.transfers, Contracts.ExchangeBRL)) &&
      containsBurnedTokenTransfer(transaction.transfers)
    )
  }

  async getEvent(transaction: BlockscoutTransaction): Promise<TokenExchangeV2> {
    const inTransfer =
      getTransferTo(transaction.transfers, Contracts.Exchange) ??
      getTransferTo(transaction.transfers, Contracts.ExchangeEUR) ??
      getTransferTo(transaction.transfers, Contracts.ExchangeBRL)
    const outTransfer = getTransferFrom(
      transaction.transfers,
      Contracts.Reserve,
    )

    if (!inTransfer) {
      throw new Error('Transfer to Exchange not found.')
    }

    if (!outTransfer) {
      throw new Error('Transfer from Reserve not found.')
    }

    return await EventBuilder.exchangeEvent(
      transaction,
      TokenTransactionTypeV2.EXCHANGE,
      inTransfer,
      outTransfer,
      transaction.fees,
    )
  }
}
