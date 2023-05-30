import {
  getTransferFrom,
  containsTransferFrom,
} from '../../transaction/TransfersUtils'
import { EventBuilder } from '../../helpers/EventBuilder'
import { TokenTransactionTypeV2, TokenTransferV2 } from '../../types'
import { BlockscoutTransaction } from '../../transaction/blockscout/BlockscoutTransaction'
import { BlockscoutTransactionType } from '../../transaction/blockscout/BlockscoutTransactionType'
import { Contracts } from '../../utils'

export class EscrowReceived extends BlockscoutTransactionType {
  public isAggregatable = false

  matches(transaction: BlockscoutTransaction): boolean {
    return (
      this.isEscrowReceivedToEOA(transaction) ||
      this.isEscrowReceivedToMTW(transaction)
    )
  }

  async getEvent(transaction: BlockscoutTransaction): Promise<TokenTransferV2> {
    const transfer = getTransferFrom(transaction.transfers, Contracts.Escrow)

    if (!transfer) {
      throw new Error('Transfer from Escrow not found.')
    }

    return await EventBuilder.transferEvent(
      transaction,
      transfer,
      TokenTransactionTypeV2.INVITE_RECEIVED,
      transfer.fromAddressHash,
      transfer.fromAccountHash,
    )
  }

  isEscrowReceivedToEOA(transaction: BlockscoutTransaction): boolean {
    return (
      transaction.transfers.length === 1 &&
      containsTransferFrom(transaction.transfers, Contracts.Escrow)
    )
  }

  isEscrowReceivedToMTW(transaction: BlockscoutTransaction): boolean {
    const transferToAcccount = getTransferFrom(
      transaction.transfers,
      Contracts.Escrow,
    )!
    const transfertoWallet = getTransferFrom(
      transaction.transfers,
      transferToAcccount?.toAddressHash,
    )
    return (
      transaction.transfers.length === 2 &&
      containsTransferFrom(transaction.transfers, Contracts.Escrow) &&
      transfertoWallet?.fromAddressHash === transferToAcccount?.toAddressHash &&
      transfertoWallet?.toAccountHash === transfertoWallet?.fromAddressHash
    )
  }
}
