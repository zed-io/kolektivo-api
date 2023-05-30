import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'
import { Contracts } from '../../utils'
import { TokenTransactionV2 } from '../../types'

export class ExchangeContractCall extends BlockscoutTransactionType {
  public isAggregatable = true

  matches(transaction: BlockscoutTransaction): boolean {
    return (
      transaction.transfers.length === 0 &&
      (transaction.input.hasContractCallTo(Contracts.Exchange) ||
        transaction.input.hasContractCallTo(Contracts.ExchangeEUR) ||
        transaction.input.hasContractCallTo(Contracts.ExchangeBRL))
    )
  }

  async getEvent(
    _transaction: BlockscoutTransaction,
  ): Promise<TokenTransactionV2> {
    throw new Error('Event type is not serializable')
  }
}
