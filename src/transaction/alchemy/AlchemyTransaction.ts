import {
  AssetTransfersWithMetadataResult,
  AssetTransfersCategory,
  TransactionReceipt,
} from 'alchemy-sdk'

// https://github.com/alchemyplatform/alchemy-sdk-js/blob/f3aa45fff08c1441c498e7288b5a62f5b7b66768/docs-md/enums/AssetTransfersCategory.md#enumeration-assettransferscategory
const NFT_TRANSFER_CATEGORIES = [
  AssetTransfersCategory.ERC721,
  AssetTransfersCategory.SPECIALNFT,
]
const ERC20_TRANSFER_CATEGORIES = [
  AssetTransfersCategory.ERC20,
  AssetTransfersCategory.INTERNAL,
  AssetTransfersCategory.EXTERNAL,
]

/**
 * Class for representing transaction data from Alchemy.
 *
 * N.B. For ACT-789; the intention is to use Alchemy's getAssetTransfers API to populate
 * transfersFrom and transfersTo, and the getTransactionReceipt API to populate txReceipt
 * in order to form a complete picture of a single transaction, including fees.
 *
 * For ACT-791 and ACT-792, the accessor methods are a best-effort at what we'll need in order
 * to classify and serialize the transaction types we wish to support, though implementors
 * should feel free to refine this interface.
 *
 * TODO: Remove above comment once Alchemy support is implemented
 */
export class AlchemyTransaction {
  transfersFrom: AssetTransfersWithMetadataResult[]
  transfersTo: AssetTransfersWithMetadataResult[]
  txReceipt: TransactionReceipt

  constructor({
    transfersFrom,
    transfersTo,
    txReceipt,
  }: {
    transfersFrom: AssetTransfersWithMetadataResult[]
    transfersTo: AssetTransfersWithMetadataResult[]
    txReceipt: TransactionReceipt
  }) {
    this.transfersFrom = transfersFrom
    this.transfersTo = transfersTo
    this.txReceipt = txReceipt

    if (!(transfersFrom.length || transfersTo.length)) {
      throw new Error('Must specify at least one transfer')
    }
    if (!this.hashesMatch()) {
      throw new Error(
        'Hashes of all transfers in a single transaction must match the transaction receipt',
      )
    }
  }

  hashesMatch(): boolean {
    return this.transfersFrom
      .concat(this.transfersTo)
      .map((t) => t.hash)
      .every((hash) => hash === this.txReceipt.transactionHash)
  }

  getNftTransfersTo(): AssetTransfersWithMetadataResult[] {
    return this.transfersTo.filter((t) =>
      NFT_TRANSFER_CATEGORIES.includes(t.category),
    )
  }

  getNftTransfersFrom(): AssetTransfersWithMetadataResult[] {
    return this.transfersFrom.filter((t) =>
      NFT_TRANSFER_CATEGORIES.includes(t.category),
    )
  }

  getErc20TransfersTo(): AssetTransfersWithMetadataResult[] {
    return this.transfersTo.filter((t) =>
      ERC20_TRANSFER_CATEGORIES.includes(t.category),
    )
  }

  getErc20TransfersFrom(): AssetTransfersWithMetadataResult[] {
    return this.transfersFrom.filter((t) =>
      ERC20_TRANSFER_CATEGORIES.includes(t.category),
    )
  }
}
