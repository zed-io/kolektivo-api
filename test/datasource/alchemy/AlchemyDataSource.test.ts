import {
  AlchemyDataSource,
  MAX_RETURN_RESULTS,
} from '../../../src/datasource/alchemy/AlchemyDataSource'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  Alchemy,
  Network,
  AssetTransfersWithMetadataResponse,
  CoreNamespace,
} from 'alchemy-sdk'
import { logger } from '../../../src/logger'
import {
  mockTxReceipt,
  mockSortedTx,
  mockErc20TransferTo,
  mockAlchemyAssetTransfersWithHash,
  mockAddress,
  mockAlchemyTransfersTo,
  mockAlchemyTransfersFrom,
  mockMergedTxs,
  mockTxReceipts,
  mockAlchemyTransactions,
  mockErc20TransferFrom,
  mockNftReceivedTx,
  mockNftSentTx,
  mockTokenReceivedTx,
  mockTokenSentTx,
  mockTokenSwapTx,
} from '../../mock-data/alchemy'
import {
  NftReceived,
  NftSent,
  TokenReceived,
  TokenSent,
  TokenSwap,
} from '../../../src/events/alchemy'

jest.mock('../../../src/logger')
jest.mock('alchemy-sdk', () => {
  const originalModule = jest.requireActual('alchemy-sdk')
  return {
    ...originalModule,
    Alchemy: jest.fn(),
  }
})

describe('AlchemyDataSource', () => {
  let mockAlchemyDataSource: AlchemyDataSource
  beforeEach(() => {
    jest.resetAllMocks()
    mockAlchemyDataSource = new AlchemyDataSource({
      network: Network.ETH_MAINNET,
      apiKey: 'some-key',
    })
  })

  describe('constructor', () => {
    it('accepts Ethereum network', () => {
      expect(
        () =>
          new AlchemyDataSource({
            network: Network.ETH_MAINNET,
            apiKey: 'some-key',
          }),
      ).not.toThrow()
    })
  })

  describe('fetchRawTransactions', () => {
    beforeEach(() => {
      jest
        .spyOn(mockAlchemyDataSource, 'fetchAlchemyTransfers')
        .mockResolvedValue({
          transfers: {
            transfersFrom: mockAlchemyTransfersFrom.transfers,
            transfersTo: mockAlchemyTransfersTo.transfers,
          },
          alchemyHasNextPage: true,
        })
      jest
        .spyOn(mockAlchemyDataSource, 'mergeTxs')
        .mockReturnValue(mockMergedTxs)
      jest
        .spyOn(mockAlchemyDataSource, 'sortAndFilterTxs')
        .mockReturnValue([mockSortedTx])
    })

    it('returns alchemy transactions', async () => {
      const mockAlchemyTransaction = new AlchemyTransaction({
        transfersFrom: [],
        transfersTo: [mockErc20TransferTo],
        txReceipt: mockTxReceipt,
      })
      jest
        .spyOn(mockAlchemyDataSource, 'constructTransactions')
        .mockResolvedValue([mockAlchemyTransaction])
      const { transactions, pageInfo } =
        await mockAlchemyDataSource.fetchRawTxs('some-address')
      expect(transactions[0]).toBe(mockAlchemyTransaction)
      expect(pageInfo.hasPreviousPage).toBe(false)
    })

    it('has previous page when afterCursor is present', async () => {
      const { pageInfo } = await mockAlchemyDataSource.fetchRawTxs(
        'some-address',
        '12345',
      )
      expect(pageInfo.hasPreviousPage).toBe(true)
      expect(pageInfo.startCursor).toBe('12345')
    })

    it('sets the endCursor when Alchemy has more pages', async () => {
      const { pageInfo } = await mockAlchemyDataSource.fetchRawTxs(
        'some-address',
      )
      expect(pageInfo.hasNextPage).toBe(true)
      expect(pageInfo.endCursor).toBe('9173697') // From mockErc20TransferTo 0x8bfac1
    })

    it('sets the endCursor when Alchemy is out of pages, but MAX_RETURN_RESULTS is reached', async () => {
      jest
        .spyOn(mockAlchemyDataSource, 'fetchAlchemyTransfers')
        .mockResolvedValue({
          transfers: { transfersFrom: [], transfersTo: [] },
          alchemyHasNextPage: false,
        })
      jest
        .spyOn(mockAlchemyDataSource, 'mergeTxs')
        .mockReturnValue([
          mockAlchemyAssetTransfersWithHash,
          mockAlchemyAssetTransfersWithHash,
        ])
      // Implies a MAX_RETURN_RESULTS of 1
      jest
        .spyOn(mockAlchemyDataSource, 'sortAndFilterTxs')
        .mockReturnValue([mockSortedTx])
      const { pageInfo } = await mockAlchemyDataSource.fetchRawTxs(
        'some-address',
      )
      expect(pageInfo.hasNextPage).toBe(true)
      expect(pageInfo.endCursor).toBe('9173697') // From mockErc20TransferTo 0x8bfac1
    })

    it('does not set the endCursor when Alchemy is out of pages and all results are returned', async () => {
      jest
        .spyOn(mockAlchemyDataSource, 'fetchAlchemyTransfers')
        .mockResolvedValue({
          transfers: { transfersFrom: [], transfersTo: [] },
          alchemyHasNextPage: false,
        })
      jest
        .spyOn(mockAlchemyDataSource, 'mergeTxs')
        .mockReturnValue([
          mockAlchemyAssetTransfersWithHash,
          mockAlchemyAssetTransfersWithHash,
        ])
      // Implies a MAX_RETURN_RESULTS of 2
      jest
        .spyOn(mockAlchemyDataSource, 'sortAndFilterTxs')
        .mockReturnValue([mockSortedTx, mockSortedTx])
      const { pageInfo } = await mockAlchemyDataSource.fetchRawTxs(
        'some-address',
      )
      expect(pageInfo.hasNextPage).toBe(false)
      expect(pageInfo.endCursor).not.toBeDefined() // From mockErc20TransferTo 0x8bfac1
    })
  })

  describe('fetchAlchemyTransfers', () => {
    let mockTransfersFrom: AssetTransfersWithMetadataResponse
    let mockTransfersTo: AssetTransfersWithMetadataResponse
    let mockGetAssetTransfers: jest.Mock

    beforeEach(() => {
      mockTransfersFrom = mockAlchemyTransfersFrom
      mockTransfersTo = mockAlchemyTransfersTo
      mockGetAssetTransfers = jest
        .fn()
        .mockImplementation(async ({ fromAddress }) => {
          return fromAddress ? mockTransfersFrom : mockTransfersTo
        })
      jest.mocked(Alchemy).mockReturnValue({
        core: {
          getAssetTransfers: mockGetAssetTransfers,
        } as unknown as CoreNamespace,
      } as Alchemy)
      mockAlchemyDataSource = new AlchemyDataSource({
        network: Network.ETH_MAINNET,
        apiKey: 'some-key',
      })
    })

    it('logs and throws an error if a fetch fails', async () => {
      const mockError = new Error('some error!')
      mockGetAssetTransfers.mockImplementation(async ({ fromAddress }) => {
        if (fromAddress) {
          throw mockError
        }
        return mockTransfersTo
      })
      await expect(
        mockAlchemyDataSource.fetchAlchemyTransfers(mockAddress),
      ).rejects.toEqual(mockError)
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith({
        type: 'ERROR_FETCHING_ALCHEMY_TRANSFERS',
        error: mockError,
      })
    })

    it('returns transfers', async () => {
      const { transfers } = await mockAlchemyDataSource.fetchAlchemyTransfers(
        mockAddress,
      )
      expect(transfers).toEqual({
        transfersFrom: mockAlchemyTransfersFrom.transfers,
        transfersTo: mockAlchemyTransfersTo.transfers,
      })
    })

    it('passes toBlock to calls if present', async () => {
      await mockAlchemyDataSource.fetchAlchemyTransfers(
        mockAddress,
        'some-to-block',
      )
      expect(mockGetAssetTransfers.mock.calls.length).toEqual(2)
      expect(mockGetAssetTransfers.mock.calls[0][0]).toMatchObject({
        toBlock: 'some-to-block',
      })
      expect(mockGetAssetTransfers.mock.calls[1][0]).toMatchObject({
        toBlock: 'some-to-block',
      })
    })

    it('sets next page available flag if page key exists for transfers to', async () => {
      mockTransfersFrom = {
        ...mockTransfersFrom,
        pageKey: undefined,
      }
      const { alchemyHasNextPage } =
        await mockAlchemyDataSource.fetchAlchemyTransfers(mockAddress)
      expect(alchemyHasNextPage).toBe(true)
    })

    it('sets next page available flag if page key exists for transfers from', async () => {
      mockTransfersTo = {
        ...mockTransfersTo,
        pageKey: undefined,
      }
      const { alchemyHasNextPage } =
        await mockAlchemyDataSource.fetchAlchemyTransfers(mockAddress)
      expect(alchemyHasNextPage).toBe(true)
    })

    it('sets next page available flag if page key exists for transfers to and from', async () => {
      const { alchemyHasNextPage } =
        await mockAlchemyDataSource.fetchAlchemyTransfers(mockAddress)
      expect(alchemyHasNextPage).toBe(true)
    })

    it('does not set next page available flag if no page keys exist', async () => {
      mockTransfersTo = {
        ...mockTransfersTo,
        pageKey: undefined,
      }
      mockTransfersFrom = {
        ...mockTransfersFrom,
        pageKey: undefined,
      }
      const { alchemyHasNextPage } =
        await mockAlchemyDataSource.fetchAlchemyTransfers(mockAddress)
      expect(alchemyHasNextPage).toBe(false)
    })
  })

  describe('mergeTxs', () => {
    it('returns empty list if no transfers', async () => {
      const result = mockAlchemyDataSource.mergeTxs({
        transfersTo: [],
        transfersFrom: [],
      })
      expect(result).toHaveLength(0)
    })
    it('returns merged transfers', async () => {
      const result = mockAlchemyDataSource.mergeTxs({
        transfersTo: mockAlchemyTransfersTo.transfers,
        transfersFrom: mockAlchemyTransfersFrom.transfers,
      })
      expect(result).toHaveLength(4)
      expect(result).toContainEqual(mockMergedTxs[0])
      expect(result).toContainEqual(mockMergedTxs[1])
      expect(result).toContainEqual(mockMergedTxs[2])
      expect(result).toContainEqual(mockMergedTxs[3])
    })
  })

  describe('sortAndFilterTxs', () => {
    it('sorts by block number', async () => {
      const result = mockAlchemyDataSource.sortAndFilterTxs(mockMergedTxs)
      expect(
        result.map(({ blockNum }: { blockNum: number }) => blockNum),
      ).toEqual([4, 3, 2, 1])
    })
    it('returns all if fewer than MAX_RETURN_RESULTS', async () => {
      const result = mockAlchemyDataSource.sortAndFilterTxs(
        mockMergedTxs.slice(0, MAX_RETURN_RESULTS),
      )
      expect(result).toHaveLength(
        Math.min(MAX_RETURN_RESULTS, mockMergedTxs.length),
      )
    })
    it('returns MAX_RETURN_RESULTS if more than MAX_RETURN_RESULTS provided', async () => {
      const mockManyMergedTxs = [
        ...Array(MAX_RETURN_RESULTS + 100)
          .fill(0)
          .map((_n) => mockMergedTxs[1]),
      ]
      const result = mockAlchemyDataSource.sortAndFilterTxs(mockManyMergedTxs)
      expect(result).toHaveLength(MAX_RETURN_RESULTS)
    })
  })

  describe('constructTransactions', () => {
    let mockGetTransactionReceipt: jest.Mock
    let mockError: Error

    beforeEach(() => {
      mockError = new Error('error getting tx receipt!')
      mockGetTransactionReceipt = jest
        .fn()
        .mockImplementation(async (txHash: string) => {
          switch (txHash) {
            case 'hash 1':
              return mockTxReceipts[0]
            case 'hash 2':
              return mockTxReceipts[1]
            case 'hash 3':
              return mockTxReceipts[2]
            case 'hash 4':
              return mockTxReceipts[3]
            default:
              throw mockError
          }
        })
      jest.mocked(Alchemy).mockReturnValue({
        core: {
          getTransactionReceipt: mockGetTransactionReceipt,
        } as unknown as CoreNamespace,
      } as Alchemy)
      mockAlchemyDataSource = new AlchemyDataSource({
        network: Network.ETH_MAINNET,
        apiKey: 'some-key',
      })
    })

    it('logs a warning if some transaction fails', async () => {
      // Replace hash 1 with unknown; hash 1 should be missing in results
      const replacedMergedTx = {
        ...mockMergedTxs[0],
        txHash: 'unknown hash',
      }
      const replacedMockMergedTxs = [
        replacedMergedTx,
        ...mockMergedTxs.slice(1),
      ]
      const results = await mockAlchemyDataSource.constructTransactions(
        replacedMockMergedTxs,
      )
      expect(results).toHaveLength(3)
      expect(results).toContainEqual(mockAlchemyTransactions[1])
      expect(results).toContainEqual(mockAlchemyTransactions[2])
      expect(results).toContainEqual(mockAlchemyTransactions[3])
      expect(logger.warn).toHaveBeenCalledTimes(1)
      expect(logger.warn).toHaveBeenCalledWith({
        type: 'ERROR_FETCHING_ALCHEMY_RECEIPT',
        transaction: JSON.stringify(replacedMergedTx),
        error: mockError,
      })
    })
    it('returns transaction instances on success', async () => {
      const results = await mockAlchemyDataSource.constructTransactions(
        mockMergedTxs,
      )
      expect(results).toHaveLength(4)
      expect(results).toContainEqual(mockAlchemyTransactions[0])
      expect(results).toContainEqual(mockAlchemyTransactions[1])
      expect(results).toContainEqual(mockAlchemyTransactions[2])
      expect(results).toContainEqual(mockAlchemyTransactions[3])
      expect(logger.warn).not.toHaveBeenCalled()
    })
  })

  describe('classifyTxs', () => {
    const logWarnSpy = jest.spyOn(logger, 'warn')

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('classifies known transactions', () => {
      const txs: AlchemyTransaction[] = [
        mockNftReceivedTx,
        mockNftSentTx,
        mockTokenReceivedTx,
        mockTokenSentTx,
        mockTokenSwapTx,
      ]

      const classifiedTxs = mockAlchemyDataSource.classifyTxs(
        'some-address',
        txs,
      )

      expect(classifiedTxs).toEqual([
        {
          transaction: mockNftReceivedTx,
          transactionType: expect.any(NftReceived),
        },
        {
          transaction: mockNftSentTx,
          transactionType: expect.any(NftSent),
        },
        {
          transaction: mockTokenReceivedTx,
          transactionType: expect.any(TokenReceived),
        },
        {
          transaction: mockTokenSentTx,
          transactionType: expect.any(TokenSent),
        },
        {
          transaction: mockTokenSwapTx,
          transactionType: expect.any(TokenSwap),
        },
      ])
      expect(logWarnSpy).not.toHaveBeenCalled()
    })

    it('ignores and logs unknown transactions', () => {
      const txs: AlchemyTransaction[] = [
        mockNftReceivedTx,
        new AlchemyTransaction({
          transfersFrom: [mockErc20TransferFrom, mockErc20TransferFrom],
          transfersTo: [],
          txReceipt: mockTxReceipt,
        }),
      ]

      const classifiedTxs = mockAlchemyDataSource.classifyTxs(
        'some-address',
        txs,
      )

      expect(classifiedTxs).toEqual([
        {
          transaction: mockNftReceivedTx,
          transactionType: expect.any(NftReceived),
        },
      ])
      expect(logWarnSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          txReceipt: mockTxReceipt,
          type: 'ERROR_MAPPING_ALCHEMY_TRANSACTION',
        }),
      )
    })
  })
})
