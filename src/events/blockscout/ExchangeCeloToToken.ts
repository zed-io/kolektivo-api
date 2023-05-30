import {
  containsMintedTokenTransfer,
  containsTransferTo,
  getMintedTokenTransfer,
  getTransferTo,
} from '../../transaction/TransfersUtils'
import { EventBuilder } from '../../helpers/EventBuilder'
import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'
import { Contracts } from '../../utils'
import { TokenTransactionTypeV2, TokenExchangeV2 } from '../../types'

export class ExchangeCeloToToken extends BlockscoutTransactionType {
  public isAggregatable = false

  matches(transaction: BlockscoutTransaction): boolean {
    return (
      transaction.transfers.length === 2 &&
      containsTransferTo(transaction.transfers, Contracts.Reserve) &&
      containsMintedTokenTransfer(transaction.transfers)
    )
  }

  async getEvent(transaction: BlockscoutTransaction): Promise<TokenExchangeV2> {
    const inTransfer = getTransferTo(transaction.transfers, Contracts.Reserve)
    const outTransfer = getMintedTokenTransfer(transaction.transfers)

    if (!inTransfer) {
      throw new Error('Transfer to Reserve not found.')
    }

    if (!outTransfer) {
      throw new Error('Minted token transfer not found.')
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
