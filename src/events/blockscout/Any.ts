import { metrics } from '../../metrics'
import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'
import { TokenTransactionV2 } from '../../types'

export class Any extends BlockscoutTransactionType {
  public isAggregatable = false

  matches(_transaction: BlockscoutTransaction): boolean {
    return true
  }

  async getEvent(
    _transaction: BlockscoutTransaction,
  ): Promise<TokenTransactionV2> {
    metrics.unknownTransaction()
    throw new Error('Unknown transaction type')
  }
}
