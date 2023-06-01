import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  AssetTransfersWithMetadataResult,
  AssetTransfersCategory,
  TransactionReceipt,
  BigNumber,
} from 'alchemy-sdk'

const mockTransfersTo: AssetTransfersWithMetadataResult[] = [
  {
    metadata: { blockTimestamp: 'some-timestamp' },
    uniqueId: 'some-id-1',
    category: AssetTransfersCategory.ERC20,
    blockNum: '0',
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
  },
  {
    metadata: { blockTimestamp: 'some-timestamp' },
    uniqueId: 'some-id-2',
    category: AssetTransfersCategory.ERC721,
    blockNum: '0',
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
  },
]

const mockTransfersFrom: AssetTransfersWithMetadataResult[] = [
  {
    metadata: { blockTimestamp: 'some-timestamp' },
    uniqueId: 'some-id-3',
    category: AssetTransfersCategory.ERC20,
    blockNum: '0',
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
  },
  {
    metadata: { blockTimestamp: 'some-timestamp' },
    uniqueId: 'some-id-4',
    category: AssetTransfersCategory.ERC721,
    blockNum: '0',
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
  },
]

const mockTxReceipt: TransactionReceipt = {
  to: 'to-address',
  from: 'from-address',
  contractAddress: 'contract-address',
  transactionIndex: 0,
  gasUsed: BigNumber.from(0),
  logsBloom: 'logs-bloom',
  blockHash: 'block-hash',
  transactionHash: 'correct-hash',
  logs: [],
  blockNumber: 0,
  confirmations: 100,
  cumulativeGasUsed: BigNumber.from(0),
  effectiveGasPrice: BigNumber.from(0),
  byzantium: false,
  type: 0,
}

describe('AlchemyTransaction', () => {
  let mockTransaction: AlchemyTransaction
  beforeEach(() => {
    mockTransaction = new AlchemyTransaction({
      transfersFrom: mockTransfersFrom,
      transfersTo: mockTransfersTo,
      txReceipt: mockTxReceipt,
    })
  })

  describe('constructor', () => {
    it('throws if both transfer lists are empty', () => {
      expect(
        () =>
          new AlchemyTransaction({
            transfersFrom: [],
            transfersTo: [],
            txReceipt: mockTxReceipt,
          }),
      ).toThrow('Must specify at least one transfer')
    })
    it('throws if hashes do not match', () => {
      const wrongTransfersFrom = [
        mockTransfersFrom[0],
        { ...mockTransfersFrom[1], hash: 'wrong-hash' },
      ]
      expect(
        () =>
          new AlchemyTransaction({
            transfersFrom: wrongTransfersFrom,
            transfersTo: mockTransfersTo,
            txReceipt: mockTxReceipt,
          }),
      ).toThrow(
        'Hashes of all transfers in a single transaction must match the transaction receipt',
      )
    })
    it('succeeds if no error', () => {
      expect(
        () =>
          new AlchemyTransaction({
            transfersFrom: mockTransfersFrom,
            transfersTo: mockTransfersTo,
            txReceipt: mockTxReceipt,
          }),
      ).not.toThrow()
    })
  })
  describe('getNftTransfersTo', () => {
    it('returns NFT transfers to address', () => {
      expect(mockTransaction.getNftTransfersTo()).toEqual([mockTransfersTo[1]])
    })
  })
  describe('getNftTransfersFrom', () => {
    it('returns NFT transfers from address', () => {
      expect(mockTransaction.getNftTransfersFrom()).toEqual([
        mockTransfersFrom[1],
      ])
    })
  })
  describe('getErc20TransfersTo', () => {
    it('returns ERC20 transfers to address', () => {
      expect(mockTransaction.getErc20TransfersTo()).toEqual([
        mockTransfersTo[0],
      ])
    })
  })
  describe('getErc20TransfersFrom', () => {
    it('returns ERC20 transfers from address', () => {
      expect(mockTransaction.getErc20TransfersFrom()).toEqual([
        mockTransfersFrom[0],
      ])
    })
  })
})
