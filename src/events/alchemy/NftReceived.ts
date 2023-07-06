import { NftTransferV2, TokenTransactionTypeV2 } from '../../types'
import { TransactionType } from '../../transaction/TransactionType'
import { AlchemyTransaction } from '../../transaction/alchemy/AlchemyTransaction'
import { EventBuilder } from '../../helpers/EventBuilder'

export class NftReceived extends TransactionType<AlchemyTransaction> {
  matches(transaction: AlchemyTransaction): boolean {
    return (
      transaction.getNftTransfersTo().length >
      transaction.getNftTransfersFrom().length
    )
  }

  async getEvent(transaction: AlchemyTransaction): Promise<NftTransferV2> {
    const nftTransfersTo = transaction.getNftTransfersTo()
    return EventBuilder.alchemyNftTransferEvent({
      transactionHash: transaction.txReceipt.transactionHash,
      chain: this.context.chain,
      type: TokenTransactionTypeV2.NFT_RECEIVED,
      block: transaction.getBlockNum(),
      nftTransfers: nftTransfersTo,
    })
  }
}
