import { TokenTransactionTypeV2, TokenTransferV2 } from '../../types'
import { TransactionType } from '../../transaction/TransactionType'
import { AlchemyTransaction } from '../../transaction/alchemy/AlchemyTransaction'
import knownAddressesCache from '../../helpers/KnownAddressesCache'

export class TokenReceived extends TransactionType<AlchemyTransaction> {
  matches(transaction: AlchemyTransaction): boolean {
    return (
      transaction.getErc20TransfersTo().length === 1 &&
      transaction.getErc20TransfersFrom().length === 0
    )
  }

  async getEvent(transaction: AlchemyTransaction): Promise<TokenTransferV2> {
    const [
      {
        metadata: { blockTimestamp },
        blockNum: block,
        hash: transactionHash,
        value,
        rawContract: { address: tokenAddress },
        to: toAddress,
        from: fromAddress,
      },
    ] = transaction.getErc20TransfersTo()
    if (!value || !tokenAddress || !toAddress) {
      throw new Error(
        `getEvent called on TokenReceived with missing required value. transactionHash: ${transactionHash}`,
      )
    }
    const timestamp = new Date(blockTimestamp).getTime()
    const { name: title, imageUrl: image } =
      knownAddressesCache.getDisplayInfoFor(fromAddress)
    return {
      type: TokenTransactionTypeV2.RECEIVED,
      timestamp,
      block,
      transactionHash,
      address: fromAddress,
      account: fromAddress,
      amount: {
        value, // according to Alchemy docs this is already in units of Eth, not Wei. https://docs.alchemy.com/reference/sdk-getassettransfers#assettransfersresponse-response-object-parameters
        tokenAddress,
        timestamp,
      },
      metadata: {
        title,
        image,
      },
      // purposefully using empty fees here because this is a received event, so this user did not pay the fees.
      //  (This is consistent with Blockscout implementation)
      fees: [],
    }
  }
}
