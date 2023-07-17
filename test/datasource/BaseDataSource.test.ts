import { Network } from 'alchemy-sdk'
import { AlchemyDataSource } from '../../src/datasource/alchemy/AlchemyDataSource'
import { TransactionType } from '../../src/transaction/TransactionType'
import { AlchemyTransaction } from '../../src/transaction/alchemy/AlchemyTransaction'
import {
  AlchemyChain,
  PageInfo,
  TokenTransactionTypeV2,
  TokenTransactionV2,
} from '../../src/types'
import {
  mockNftReceivedTx,
  mockNftSentTx,
  mockTokenReceivedTx,
  mockTokenSentTx,
} from '../mock-data/alchemy'
import { BaseDataSource } from '../../src/datasource/BaseDataSource'
import { fetchFromFirebase } from '../../src/firebase'
import { logger } from '../../src/logger'
import {
  NftReceived,
  NftSent,
  TokenReceived,
  TokenSent,
} from '../../src/events/alchemy'

jest.mock('../../src/firebase')
jest.mock('../../src/logger')

function getMockTransactionType(
  txType: TransactionType<AlchemyTransaction>,
  eventType: TokenTransactionTypeV2,
  timestamp: number,
) {
  jest
    .spyOn(txType, 'getEvent')
    .mockResolvedValue({ type: eventType, timestamp } as TokenTransactionV2)
  return txType
}

describe('BaseDataSource', () => {
  describe('getTokenTxs', () => {
    const datasource: BaseDataSource<
      AlchemyTransaction,
      TransactionType<AlchemyTransaction>
    > = new AlchemyDataSource({
      network: Network.ETH_MAINNET,
      apiKey: 'some-key',
      chain: AlchemyChain.Ethereum,
    })
    const mockTxs: AlchemyTransaction[] = [
      mockTokenReceivedTx,
      mockTokenSentTx,
      mockNftReceivedTx,
      mockNftSentTx,
    ]
    const mockPageInfo: PageInfo = {
      hasPreviousPage: false,
      hasNextPage: true,
      startCursor: 'start',
      endCursor: 'end',
    }
    const mockContext = { userAddress: '0xABCD', chain: AlchemyChain.Ethereum }

    const mockTxTypes: TransactionType<AlchemyTransaction>[] = []

    beforeEach(() => {
      mockTxTypes.push(
        getMockTransactionType(
          new TokenReceived(mockContext),
          TokenTransactionTypeV2.RECEIVED,
          1000,
        ),
      )
      mockTxTypes.push(
        getMockTransactionType(
          new TokenSent(mockContext),
          TokenTransactionTypeV2.SENT,
          1000,
        ),
      )
      mockTxTypes.push(
        getMockTransactionType(
          new NftReceived(mockContext),
          TokenTransactionTypeV2.NFT_RECEIVED,
          2000,
        ),
      )
      mockTxTypes.push(
        getMockTransactionType(
          new NftSent(mockContext),
          TokenTransactionTypeV2.NFT_SENT,
          1500,
        ),
      )
      jest
        .spyOn(datasource, 'fetchRawTxs')
        .mockResolvedValue({ transactions: mockTxs, pageInfo: mockPageInfo })
      jest.spyOn(datasource, 'classifyTxs').mockReturnValue(
        mockTxs.map((tx, index) => ({
          transaction: tx,
          transactionType: mockTxTypes[index],
        })),
      )
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('fetches, classifies and returns sorted serialized transactions', async () => {
      const result = await datasource.getTokenTxs('0xABCD', 'cursor', '1.1')

      expect(result.transactions).toHaveLength(4)
      expect(result.pageInfo).toEqual(mockPageInfo)
      expect(result.transactions.map((tx) => tx.type)).toEqual([
        TokenTransactionTypeV2.NFT_RECEIVED,
        TokenTransactionTypeV2.NFT_SENT,
        TokenTransactionTypeV2.RECEIVED,
        TokenTransactionTypeV2.SENT,
      ])
      expect(datasource.fetchRawTxs).toHaveBeenCalledWith('0xABCD', 'cursor')
      expect(datasource.classifyTxs).toHaveBeenCalledWith(
        '0xABCD',
        mockTxs,
        '1.1',
      )
      expect(fetchFromFirebase).not.toHaveBeenCalled()
      expect(logger.warn).not.toHaveBeenCalled()
    })

    it('gets valora version from firebase if not set', async () => {
      jest.mocked(fetchFromFirebase).mockResolvedValue({ appVersion: '1.2' })
      const result = await datasource.getTokenTxs('0xABCD')

      expect(result.transactions).toHaveLength(4)
      expect(result.pageInfo).toEqual(mockPageInfo)
      expect(result.transactions.map((tx) => tx.type)).toEqual([
        TokenTransactionTypeV2.NFT_RECEIVED,
        TokenTransactionTypeV2.NFT_SENT,
        TokenTransactionTypeV2.RECEIVED,
        TokenTransactionTypeV2.SENT,
      ])
      expect(datasource.fetchRawTxs).toHaveBeenCalledWith('0xABCD', undefined)
      expect(datasource.classifyTxs).toHaveBeenCalledWith(
        '0xABCD',
        mockTxs,
        '1.2',
      )
      expect(fetchFromFirebase).toHaveBeenCalledWith(`registrations/0xabcd`)
      expect(logger.warn).not.toHaveBeenCalled()
    })

    it('logs warning if serialization fails some some transactions', async () => {
      jest.spyOn(mockTxTypes[0], 'getEvent').mockRejectedValue('err1')
      jest.spyOn(mockTxTypes[2], 'getEvent').mockRejectedValue('err2')
      const result = await datasource.getTokenTxs('0xABCD', 'cursor', '1.1')

      expect(result.transactions).toHaveLength(2)
      expect(result.pageInfo).toEqual(mockPageInfo)
      expect(result.transactions.map((tx) => tx.type)).toEqual([
        TokenTransactionTypeV2.NFT_SENT,
        TokenTransactionTypeV2.SENT,
      ])
      expect(datasource.fetchRawTxs).toHaveBeenCalledWith('0xABCD', 'cursor')
      expect(datasource.classifyTxs).toHaveBeenCalledWith(
        '0xABCD',
        mockTxs,
        '1.1',
      )
      expect(fetchFromFirebase).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledTimes(2)
      expect(logger.warn).toHaveBeenCalledWith({
        err: 'err1',
        transaction: JSON.stringify(mockTxs[0]),
        type: 'ERROR_MAPPING_TO_EVENT_V2',
      })
      expect(logger.warn).toHaveBeenCalledWith({
        err: 'err2',
        transaction: JSON.stringify(mockTxs[2]),
        type: 'ERROR_MAPPING_TO_EVENT_V2',
      })
    })
  })
})
