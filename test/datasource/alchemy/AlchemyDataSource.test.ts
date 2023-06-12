import { AlchemyDataSource } from '../../../src/datasource/alchemy/AlchemyDataSource'
import {
  NftReceived,
  NftSent,
  TokenReceived,
  TokenSent,
  TokenSwap,
} from '../../../src/events/alchemy'
import { logger } from '../../../src/logger'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import { Chain } from '../../../src/types'
import {
  mockErc20Transfer,
  mockNftReceivedTx,
  mockNftSentTx,
  mockTokenReceivedTx,
  mockTokenSentTx,
  mockTokenSwapTx,
  mockTxReceipt,
} from '../../mock-data/alchemy'

describe('AlchemyDataSource', () => {
  describe('constructor', () => {
    it('accepts Ethereum chain', () => {
      expect(() => new AlchemyDataSource(Chain.Ethereum)).not.toThrow()
    })
    it('throws on unsupported chain', () => {
      expect(() => new AlchemyDataSource(Chain.Celo)).toThrow()
    })
  })

  describe('classifyTxs', () => {
    const datasource = new AlchemyDataSource(Chain.Ethereum)
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

      const classifiedTxs = datasource.classifyTxs('some-address', txs)

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
          transfersFrom: [mockErc20Transfer, mockErc20Transfer],
          transfersTo: [],
          txReceipt: mockTxReceipt,
        }),
      ]

      const classifiedTxs = datasource.classifyTxs('some-address', txs)

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
