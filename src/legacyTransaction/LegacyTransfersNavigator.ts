import { BlockscoutCeloTransfer } from '../types'
import { ContractAddresses, Contracts } from '../utils'
import { LegacyTransferCollection } from './LegacyTransferCollection'

const MINTED_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'

export class LegacyTransfersNavigator {
  private contractAddresses: ContractAddresses
  private faucetAddress: string
  private transferCollection: LegacyTransferCollection

  get length(): number {
    return this.transferCollection.length
  }

  constructor(
    contractAddresses: ContractAddresses,
    faucetAddress: string,
    transferCollection: LegacyTransferCollection,
  ) {
    this.contractAddresses = contractAddresses
    this.faucetAddress = faucetAddress
    this.transferCollection = transferCollection
  }

  isEmpty(): boolean {
    return this.transferCollection.isEmpty()
  }

  containsFaucetTransfer(): boolean {
    return this.containsTransferFrom(this.faucetAddress)
  }

  containsMintedTokenTransfer(): boolean {
    return this.containsTransferFrom(MINTED_TOKEN_ADDRESS)
  }

  containsBurnedTokenTransfer(): boolean {
    return this.containsTransferTo(MINTED_TOKEN_ADDRESS)
  }

  containsTransferFrom(senderAddress: Contracts | string): boolean {
    const contractAddress = this.contractAddresses[senderAddress as Contracts]
    const sender = contractAddress ? contractAddress : senderAddress

    return this.getTransferFrom(sender) !== undefined
  }

  containsTransferTo(recipientAddress: Contracts | string): boolean {
    const contractAddress =
      this.contractAddresses[recipientAddress as Contracts]
    const recipient = contractAddress ? contractAddress : recipientAddress

    return this.getTransferTo(recipient) !== undefined
  }

  getFaucetTransfer(): BlockscoutCeloTransfer | undefined {
    return this.getTransferFrom(this.faucetAddress)
  }

  getMintedTokenTransfer(): BlockscoutCeloTransfer | undefined {
    return this.getTransferFrom(MINTED_TOKEN_ADDRESS)
  }

  getBurnedTokenTransfer(): BlockscoutCeloTransfer | undefined {
    return this.getTransferTo(MINTED_TOKEN_ADDRESS)
  }

  getTransferFrom(
    senderAddress: Contracts | string,
  ): BlockscoutCeloTransfer | undefined {
    const contractAddress = this.contractAddresses[senderAddress as Contracts]
    const sender = contractAddress ? contractAddress : senderAddress

    return this.transferCollection.get(
      (transfer: BlockscoutCeloTransfer): boolean =>
        transfer.fromAddressHash.toLowerCase() === sender,
    )
  }

  getTransferTo(
    recipientAddress: Contracts | string,
  ): BlockscoutCeloTransfer | undefined {
    const contractAddress =
      this.contractAddresses[recipientAddress as Contracts]
    const recipient = contractAddress ? contractAddress : recipientAddress

    return this.transferCollection.get(
      (transfer: BlockscoutCeloTransfer): boolean =>
        transfer.toAddressHash.toLowerCase() === recipient,
    )
  }

  popLastTransfer(): BlockscoutCeloTransfer | undefined {
    return this.transferCollection.pop()
  }

  popTransferTo(
    recipientAddress: Contracts | string,
  ): BlockscoutCeloTransfer | undefined {
    const contractAddress =
      this.contractAddresses[recipientAddress as Contracts]
    const recipient = contractAddress ? contractAddress : recipientAddress

    return this.transferCollection.popWhich(
      (transfer: BlockscoutCeloTransfer): boolean =>
        transfer.toAddressHash.toLowerCase() === recipient,
    )
  }
}
