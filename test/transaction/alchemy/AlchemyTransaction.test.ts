import { AssetTransfersWithMetadataResult } from 'alchemy-sdk'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  mockErc20Transfer,
  mockNftTransfer,
  mockTxReceipt,
} from '../../mock-data/alchemy'

const mockTransfersTo: AssetTransfersWithMetadataResult[] = [
  {
    ...mockErc20Transfer,
    uniqueId: 'some-id-1',
  },
  {
    ...mockNftTransfer,
    uniqueId: 'some-id-2',
  },
]

const mockTransfersFrom: AssetTransfersWithMetadataResult[] = [
  {
    ...mockErc20Transfer,
    uniqueId: 'some-id-3',
  },
  {
    ...mockNftTransfer,
    uniqueId: 'some-id-4',
  },
]

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
