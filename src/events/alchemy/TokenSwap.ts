import { TokenTransferV2 } from '../../types'
import { TransactionType } from '../../transaction/TransactionType'
import { AlchemyTransaction } from '../../transaction/alchemy/AlchemyTransaction'

export class TokenSwap extends TransactionType<AlchemyTransaction> {
  matches(transaction: AlchemyTransaction): boolean {
    return (
      transaction.getErc20TransfersFrom().length === 1 &&
      transaction.getErc20TransfersTo().length === 1 &&
      transaction.getNftTransfersFrom().length === 0 &&
      transaction.getNftTransfersTo().length === 0
    )
  }

  async getEvent(_transaction: AlchemyTransaction): Promise<TokenTransferV2> {
    throw new Error('not implemented')
  }
}
