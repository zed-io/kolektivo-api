import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'
import { Contracts } from '../../utils'
import { TokenTransactionV2 } from '../../types'

export class EscrowContractCall extends BlockscoutTransactionType {
  public isAggregatable = true

  matches(transaction: BlockscoutTransaction): boolean {
    return (
      transaction.transfers.length === 0 &&
      transaction.input.hasContractCallTo(Contracts.Escrow)
    )
  }

  async getEvent(
    _transaction: BlockscoutTransaction,
  ): Promise<TokenTransactionV2> {
    throw new Error('Event type is not serializable')
  }
}
