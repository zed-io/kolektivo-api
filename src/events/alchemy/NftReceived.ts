import { TokenTransferV2 } from '../../types'
import { TransactionType } from '../../transaction/TransactionType'
import { AlchemyTransaction } from '../../transaction/alchemy/AlchemyTransaction'

export class NftReceived extends TransactionType<AlchemyTransaction> {
  matches(transaction: AlchemyTransaction): boolean {
    return (
      transaction.getNftTransfersTo().length >
      transaction.getNftTransfersFrom().length
    )
  }

  async getEvent(_transaction: AlchemyTransaction): Promise<TokenTransferV2> {
    throw new Error('not implemented')
  }
}
