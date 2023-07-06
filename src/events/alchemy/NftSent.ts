import { NftTransferV2, TokenTransactionTypeV2 } from '../../types'
import { TransactionType } from '../../transaction/TransactionType'
import { AlchemyTransaction } from '../../transaction/alchemy/AlchemyTransaction'
import { EventBuilder } from '../../helpers/EventBuilder'

export class NftSent extends TransactionType<AlchemyTransaction> {
  matches(transaction: AlchemyTransaction): boolean {
    return (
      transaction.getNftTransfersFrom().length >
      transaction.getNftTransfersTo().length
    )
  }

  async getEvent(transaction: AlchemyTransaction): Promise<NftTransferV2> {
    const nftTransfersFrom = transaction.getNftTransfersFrom()
    return EventBuilder.alchemyNftTransferEvent({
      transactionHash: transaction.txReceipt.transactionHash,
      chain: this.context.chain,
      type: TokenTransactionTypeV2.NFT_SENT,
      block: transaction.getBlockNum(),
      nftTransfers: nftTransfersFrom,
    })
  }
}
