import {
  AssetTransfersWithMetadataResult,
  AssetTransfersCategory,
  TransactionReceipt,
  BigNumber,
  AssetTransfersWithMetadataResponse,
} from 'alchemy-sdk'
import { AlchemyTransaction } from '../../src/transaction/alchemy/AlchemyTransaction'
import { AlchemyAssetTransfers } from '../../src/datasource/alchemy/AlchemyDataSource'

export const mockAddress = '0xb90400ed648586c92173a2faa56af6106e1e369e'

export const mockTxReceipt: TransactionReceipt = {
  to: '0x779d1b5315df083e3F9E94cB495983500bA8E907',
  from: mockAddress,
  contractAddress: 'null',
  transactionIndex: 18,
  gasUsed: BigNumber.from('0x037ba0'),
  logsBloom:
    '0x00000000000000000000000000010004000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000200220000000000000008000000000000000000000000000000000000000010000000000000000000008000000000000000000000004000000010000010000000000000000000000000000000000000000000000000800000000000000000000000042000000000000000000000000000000000000000000000000000000010000002000000000002200000000000000000000000000000200000000000000000000000000000000000040000000000000000000000000000000000000000',
  blockHash:
    '0x7eb9a8a811f71c8233012e9b12761c765a0674b3714168b3c98250a390feae3a',
  transactionHash:
    '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e',
  logs: [
    {
      removed: false,
      transactionIndex: 18,
      blockNumber: 9173717,
      transactionHash:
        '0x239d1c6fe9207175f0d6e5c5018a8bd2406e7314f14cf155b6d537ca16963080',
      address: '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x000000000000000000000000b90400ed648586c92173a2faa56af6106e1e369e',
        '0x000000000000000000000000b613e78e2068d7489bb66419fb1cfa11275d14da',
      ],
      data: '0x000000000000000000000000000000000000000000000000085458f9ed74fe51',
      logIndex: 40,
      blockHash:
        '0x7eb9a8a811f71c8233012e9b12761c765a0674b3714168b3c98250a390feae3a',
    },
    {
      removed: false,
      transactionIndex: 18,
      blockNumber: 9173717,
      transactionHash:
        '0x239d1c6fe9207175f0d6e5c5018a8bd2406e7314f14cf155b6d537ca16963080',
      address: '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F',
      topics: [
        '0x9d9c909296d9c674451c0c24f02cb64981eb3b727f99865939192f880a755dcb',
        '0x000000000000000000000000b90400ed648586c92173a2faa56af6106e1e369e',
        '0x000000000000000000000000b613e78e2068d7489bb66419fb1cfa11275d14da',
      ],
      data: '0x0000000000000000000000000000000000000000000000000738a4055db9d616',
      logIndex: 41,
      blockHash:
        '0x7eb9a8a811f71c8233012e9b12761c765a0674b3714168b3c98250a390feae3a',
    },
    {
      removed: false,
      transactionIndex: 18,
      blockNumber: 9173717,
      transactionHash:
        '0x239d1c6fe9207175f0d6e5c5018a8bd2406e7314f14cf155b6d537ca16963080',
      address: '0x779d1b5315df083e3F9E94cB495983500bA8E907',
      topics: [
        '0x7cfff908a4b583f36430b25d75964c458d8ede8a99bd61be750e97ee1b2f3a96',
      ],
      data: '0x000000000000000000000000b90400ed648586c92173a2faa56af6106e1e369e0000000000000000000000001643e812ae58766192cf7d2cf9567df2c37e9b7f000000000000000000000000b613e78e2068d7489bb66419fb1cfa11275d14da00000000000000000000000000000000000000000000000007f4fc00dffe1dd8',
      logIndex: 42,
      blockHash:
        '0x7eb9a8a811f71c8233012e9b12761c765a0674b3714168b3c98250a390feae3a',
    },
  ],
  blockNumber: 9173717,
  confirmations: 839,
  cumulativeGasUsed: BigNumber.from('0x560978'),
  effectiveGasPrice: BigNumber.from('0x596b3a59'),
  status: 1,
  type: 2,
  byzantium: true,
}

export const mockErc20TransferTo: AssetTransfersWithMetadataResult = {
  blockNum: '0xf',
  uniqueId:
    '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e:log:42',
  hash: '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e',
  from: '0xe90d9a3e765a221bc1a697a1a3b0bb2e8e8c5e78',
  to: mockAddress,
  value: 0.27673935886568457,
  erc721TokenId: null,
  erc1155Metadata: null,
  tokenId: null,
  asset: 'rETH',
  category: AssetTransfersCategory.ERC20,
  rawContract: {
    value: '0x03d72cfb0c8ef856',
    address: '0x178e141a0e3b34152f73ff610437a7bf9b83267a',
    decimal: '0x12',
  },
  metadata: {
    blockTimestamp: '2023-06-13T20:53:24.000Z',
  },
}

export const mockErc20TransferFrom: AssetTransfersWithMetadataResult = {
  blockNum: '0xf',
  uniqueId:
    '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e:log:42',
  hash: '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e',
  to: '0xe90d9a3e765a221bc1a697a1a3b0bb2e8e8c5e78',
  from: mockAddress,
  value: 0.27673935886568457,
  erc721TokenId: null,
  erc1155Metadata: null,
  tokenId: null,
  asset: 'rETH',
  category: AssetTransfersCategory.ERC20,
  rawContract: {
    value: '0x03d72cfb0c8ef856',
    address: '0x178e141a0e3b34152f73ff610437a7bf9b83267a',
    decimal: '0x12',
  },
  metadata: {
    blockTimestamp: '2023-06-13T20:53:24.000Z',
  },
}

export const mockAlchemyAssetTransfers: AlchemyAssetTransfers = {
  transfersTo: [mockErc20TransferTo],
  transfersFrom: [mockErc20TransferFrom],
}

export const mockAlchemyAssetTransfersWithHash = {
  txHash: '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e',
  transfers: mockAlchemyAssetTransfers,
}

export const mockSortedTx = {
  txHash: '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e',
  blockNum: 9173697,
  transfers: {
    transfersFrom: [],
    transfersTo: [mockErc20TransferTo],
  },
}

// Taken together, mockAlchemyTransfersTo & mockAlchemyTransfersFrom comprise:
// * A TX with only a transferTo
// * A TX with only a transferFrom
// * A TX with a single transferTo and transferFrom
// * A TX with multiple transferTos and transferFroms
export const mockAlchemyTransfersTo: AssetTransfersWithMetadataResponse = {
  transfers: [
    {
      ...mockErc20TransferTo,
      hash: 'hash 2',
      blockNum: '0x01',
    },
    {
      ...mockErc20TransferTo,
      hash: 'hash 1',
      blockNum: '0x03',
    },
    {
      ...mockErc20TransferTo,
      hash: 'hash 4',
      blockNum: '0x04',
    },
    {
      ...mockErc20TransferTo,
      hash: 'hash 4',
      blockNum: '0x04',
    },
  ],
  pageKey: 'some-page-key',
}

export const mockAlchemyTransfersFrom: AssetTransfersWithMetadataResponse = {
  transfers: [
    {
      ...mockErc20TransferFrom,
      hash: 'hash 2',
      blockNum: '0x01',
    },
    {
      ...mockErc20TransferFrom,
      hash: 'hash 3',
      blockNum: '0x02',
    },
    {
      ...mockErc20TransferFrom,
      hash: 'hash 4',
      blockNum: '0x04',
    },
    {
      ...mockErc20TransferFrom,
      hash: 'hash 4',
      blockNum: '0x04',
    },
  ],
  pageKey: 'some-page-key',
}

export const mockMergedTxs: {
  txHash: string
  transfers: AlchemyAssetTransfers
}[] = [
  {
    txHash: 'hash 1',
    transfers: {
      transfersTo: [mockAlchemyTransfersTo.transfers[1]],
      transfersFrom: [],
    },
  },
  {
    txHash: 'hash 2',
    transfers: {
      transfersTo: [mockAlchemyTransfersTo.transfers[0]],
      transfersFrom: [mockAlchemyTransfersFrom.transfers[0]],
    },
  },
  {
    txHash: 'hash 3',
    transfers: {
      transfersTo: [],
      transfersFrom: [mockAlchemyTransfersFrom.transfers[1]],
    },
  },
  {
    txHash: 'hash 4',
    transfers: {
      transfersTo: [
        mockAlchemyTransfersTo.transfers[2],
        mockAlchemyTransfersTo.transfers[3],
      ],
      transfersFrom: [
        mockAlchemyTransfersFrom.transfers[2],
        mockAlchemyTransfersFrom.transfers[3],
      ],
    },
  },
]

export const mockTxReceipts: TransactionReceipt[] = [
  {
    ...mockTxReceipt,
    transactionHash: 'hash 1',
  },
  {
    ...mockTxReceipt,
    transactionHash: 'hash 2',
  },
  {
    ...mockTxReceipt,
    transactionHash: 'hash 3',
  },
  {
    ...mockTxReceipt,
    transactionHash: 'hash 4',
  },
]

export const mockAlchemyTransactions = [
  new AlchemyTransaction({
    transfersFrom: mockMergedTxs[0].transfers.transfersFrom,
    transfersTo: mockMergedTxs[0].transfers.transfersTo,
    txReceipt: mockTxReceipts[0],
  }),
  new AlchemyTransaction({
    transfersFrom: mockMergedTxs[1].transfers.transfersFrom,
    transfersTo: mockMergedTxs[1].transfers.transfersTo,
    txReceipt: mockTxReceipts[1],
  }),
  new AlchemyTransaction({
    transfersFrom: mockMergedTxs[2].transfers.transfersFrom,
    transfersTo: mockMergedTxs[2].transfers.transfersTo,
    txReceipt: mockTxReceipts[2],
  }),
  new AlchemyTransaction({
    transfersFrom: mockMergedTxs[3].transfers.transfersFrom,
    transfersTo: mockMergedTxs[3].transfers.transfersTo,
    txReceipt: mockTxReceipts[3],
  }),
]

export const mockNftTransferTo: AssetTransfersWithMetadataResult = {
  ...mockErc20TransferTo,
  to: mockAddress,
  category: AssetTransfersCategory.ERC721,
}

export const mockNftTransferFrom: AssetTransfersWithMetadataResult = {
  ...mockErc20TransferTo,
  from: mockAddress,
  category: AssetTransfersCategory.ERC721,
}

export const mockNftReceivedTx = new AlchemyTransaction({
  transfersFrom: [],
  transfersTo: [mockNftTransferTo],
  txReceipt: mockTxReceipt,
})

export const mockNftSentTx = new AlchemyTransaction({
  transfersFrom: [mockNftTransferFrom],
  transfersTo: [],
  txReceipt: mockTxReceipt,
})

export const mockTokenReceivedTx = new AlchemyTransaction({
  transfersFrom: [],
  transfersTo: [mockErc20TransferTo],
  txReceipt: mockTxReceipt,
})

export const mockTokenSentTx = new AlchemyTransaction({
  transfersFrom: [mockErc20TransferFrom],
  transfersTo: [],
  txReceipt: mockTxReceipt,
})

export const mockTokenSwapTx = new AlchemyTransaction({
  transfersFrom: [{ ...mockErc20TransferFrom, uniqueId: 'id-from' }],
  transfersTo: [{ ...mockErc20TransferTo, uniqueId: 'id-to' }],
  txReceipt: mockTxReceipt,
})
