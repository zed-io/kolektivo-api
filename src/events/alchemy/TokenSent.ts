import { TokenTransactionTypeV2, TokenTransferV2 } from '../../types'
import { TransactionType } from '../../transaction/TransactionType'
import { AlchemyTransaction } from '../../transaction/alchemy/AlchemyTransaction'
import knownAddressesCache from '../../helpers/KnownAddressesCache'

export class TokenSent extends TransactionType<AlchemyTransaction> {
  matches(transaction: AlchemyTransaction): boolean {
    return (
      transaction.getErc20TransfersFrom().length === 1 &&
      transaction.getErc20TransfersTo().length === 0
    )
  }

  async getEvent(transaction: AlchemyTransaction): Promise<TokenTransferV2> {
    const [
      {
        metadata: { blockTimestamp },
        hash: transactionHash,
        value,
        rawContract: { address: tokenAddress },
        to: toAddress,
      },
    ] = transaction.getErc20TransfersFrom()
    if (!value || !tokenAddress || !toAddress) {
      throw new Error(
        `getEvent called on TokenSent with missing required value. transactionHash: ${transactionHash}`,
      )
    }
    // get title, image from knownAddressesCache
    const { name: title, imageUrl: image } =
      knownAddressesCache.getDisplayInfoFor(toAddress)
    const timestamp = new Date(blockTimestamp).getTime()
    return {
      type: TokenTransactionTypeV2.SENT,
      timestamp,
      block: transaction.getBlockNum(),
      transactionHash,
      address: toAddress,
      account: toAddress,
      amount: {
        value, // according to Alchemy docs this is already in units of Eth, not Wei. https://docs.alchemy.com/reference/sdk-getassettransfers#assettransfersresponse-response-object-parameters
        tokenAddress,
        timestamp,
      },
      metadata: {
        title,
        image,
      },
      fees: [], // TODO add fees once wallet can handle fees paid in native currency https://linear.app/valora/issue/ACT-840/display-fees-correctly-when-paid-in-native-token
    }
  }
}
