import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'
import { TokenTransactionV2 } from '../../types'

export class ContractCall extends BlockscoutTransactionType {
  public isAggregatable = false

  matches(transaction: BlockscoutTransaction): boolean {
    return transaction.transfers.length === 0
  }

  async getEvent(
    _transaction: BlockscoutTransaction,
  ): Promise<TokenTransactionV2> {
    throw new Error('Event type is not serializable')
  }
}
