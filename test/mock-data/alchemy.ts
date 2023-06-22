import {
  AssetTransfersWithMetadataResult,
  AssetTransfersCategory,
  TransactionReceipt,
  BigNumber,
} from 'alchemy-sdk'
import { AlchemyTransaction } from '../../src/transaction/alchemy/AlchemyTransaction'

export const mockErc20Transfer: AssetTransfersWithMetadataResult = {
  metadata: { blockTimestamp: '2022-12-07T23:49:35.000Z' },
  uniqueId: 'some-id-1',
  category: AssetTransfersCategory.ERC20,
  blockNum: '0xf',
  from: 'from-address',
  to: 'to-address',
  value: 1.233468,
  erc721TokenId: null,
  erc1155Metadata: null,
  tokenId: 'token-id',
  asset: 'asset-name',
  hash: 'correct-hash',
  rawContract: {
    value: '0x12d23c',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimal: '0x6',
  },
}

export const mockNftTransfer: AssetTransfersWithMetadataResult = {
  metadata: { blockTimestamp: 'some-timestamp' },
  uniqueId: 'some-id-2',
  category: AssetTransfersCategory.ERC721,
  blockNum: '0xf',
  from: 'from-address',
  to: 'to-address',
  value: 100,
  erc721TokenId: null,
  erc1155Metadata: null,
  tokenId: 'token-id',
  asset: 'asset-name',
  hash: 'correct-hash',
  rawContract: {
    value: '10',
    address: 'contract-address',
    decimal: '18',
  },
}

export const mockTxReceipt: TransactionReceipt = {
  to: 'to-address',
  from: 'from-address',
  contractAddress: 'contract-address',
  transactionIndex: 0,
  gasUsed: BigNumber.from(0),
  logsBloom: 'logs-bloom',
  blockHash: 'block-hash',
  transactionHash: 'correct-hash',
  logs: [],
  blockNumber: 15,
  confirmations: 100,
  cumulativeGasUsed: BigNumber.from(0),
  effectiveGasPrice: BigNumber.from(0),
  byzantium: false,
  type: 0,
}

export const mockNftReceivedTx = new AlchemyTransaction({
  transfersFrom: [],
  transfersTo: [mockNftTransfer],
  txReceipt: mockTxReceipt,
})

export const mockNftSentTx = new AlchemyTransaction({
  transfersFrom: [mockNftTransfer],
  transfersTo: [],
  txReceipt: mockTxReceipt,
})

export const mockTokenReceivedTx = new AlchemyTransaction({
  transfersFrom: [],
  transfersTo: [mockErc20Transfer],
  txReceipt: mockTxReceipt,
})

export const mockTokenSentTx = new AlchemyTransaction({
  transfersFrom: [mockErc20Transfer],
  transfersTo: [],
  txReceipt: mockTxReceipt,
})

export const mockTokenSwapTx = new AlchemyTransaction({
  transfersFrom: [{ ...mockErc20Transfer, uniqueId: 'id-from' }],
  transfersTo: [{ ...mockErc20Transfer, uniqueId: 'id-to' }],
  txReceipt: mockTxReceipt,
})
