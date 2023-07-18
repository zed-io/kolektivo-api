import { TokenExchangeV2, TokenTransactionTypeV2 } from '../../types'
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

  async getEvent(transaction: AlchemyTransaction): Promise<TokenExchangeV2> {
    const [
      {
        metadata: { blockTimestamp },
        value: inValue,
        rawContract: { address: inTokenAddress },
      },
    ] = transaction.getErc20TransfersTo()
    const [
      {
        value: outValue,
        rawContract: { address: outTokenAddress },
      },
    ] = transaction.getErc20TransfersFrom()

    if (!inValue || !outValue || !inTokenAddress || !outTokenAddress) {
      throw new Error(
        `getEvent called on TokenSwap with missing required value. transactionHash: ${transaction.txReceipt.transactionHash}`,
      )
    }

    const timestamp = new Date(blockTimestamp).getTime()

    return {
      type: TokenTransactionTypeV2.SWAP_TRANSACTION,
      timestamp,
      block: transaction.getBlockNum(),
      transactionHash: transaction.txReceipt.transactionHash,
      inAmount: {
        value: inValue,
        tokenAddress: inTokenAddress,
        timestamp,
      },
      outAmount: {
        value: outValue,
        tokenAddress: outTokenAddress,
        timestamp,
      },
      fees: [], // TODO add fees once wallet can handle fees paid in native currency https://linear.app/valora/issue/ACT-840/display-fees-correctly-when-paid-in-native-token
    }
  }
}
