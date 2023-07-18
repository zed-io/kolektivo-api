import { BlockscoutDataSource } from '../../../src/datasource/blockscout/BlockscoutDataSource'
import { BlockscoutTransaction } from '../../../src/transaction/blockscout/BlockscoutTransaction'
import mockTokenTxs, {
  TEST_DOLLAR_ADDRESS,
  TEST_GOLD_ADDRESS,
} from '../../mockTokenTxsV2'
import {
  Any,
  ContractCall,
  EscrowReceived,
  EscrowSent,
  ExchangeCeloToToken,
  ExchangeTokenToCelo,
  TokenReceived,
  TokenSent,
} from '../../../src/events/blockscout'
import { NftReceived } from '../../../src/events/blockscout/NftReceived'
import { NftSent } from '../../../src/events/blockscout/NftSent'
import { SwapTransaction } from '../../../src/events/blockscout/SwapTransaction'

const mockDataSourcePost = jest.fn().mockResolvedValue(mockTokenTxs)

jest.mock('apollo-datasource-rest', () => {
  class MockRESTDataSource {
    baseUrl = ''
    post = mockDataSourcePost
  }

  return {
    RESTDataSource: MockRESTDataSource,
  }
})

// NOTE: this mock is needed for a nested blockscout tx dependency
jest.mock('../../../src/utils.ts', () => {
  const contractGetter = jest.fn()
  const tokenAddressMapping: { [key: string]: string } = {
    ['0x000000000000000000000000000000000000gold']: 'Celo Gold',
    ['0x0000000000000000000000000000000000dollar']: 'Celo Dollar',
  }
  contractGetter.mockReturnValue({
    tokenAddressMapping,
    GoldToken: '0x000000000000000000000000000000000000gold',
    StableToken: '0x0000000000000000000000000000000000dollar',
    Attestations: '0x0000000000000000000000000000000000a77357',
    Escrow: '0x0000000000000000000000000000000000a77327',
    Exchange: '0xf1235cb0d3703e7cc2473fb4e214fbc7a9ff77cc',
    ExchangeEUR: '0xd1235cb0d3703e7cc2473fb4e214fbc7a9ff77cc',
    ExchangeBRL: '0x4a3acb12178b40d8ca2b719cba6bcae0e8e31f4c',
    Governance: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
    Reserve: '0x6a61e1e693c765cbab7e02a500665f2e13ee46df',
  })
  return {
    ...(jest.requireActual('../../../src/utils.ts') as any),
    getContractAddresses: contractGetter,
    getContractAddressesOrError: contractGetter,
  }
})

jest.mock('../../../src/helpers/TokenInfoCache.ts', () => ({
  getTokenAddresses: () =>
    [TEST_GOLD_ADDRESS, TEST_DOLLAR_ADDRESS].map((address) =>
      address.toLowerCase(),
    ),
}))

describe('BlockscoutDataSource', () => {
  const datasource = new BlockscoutDataSource()

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchRawTxs', () => {
    it('fetches transactions from blockscout graphql', async () => {
      const result = await datasource.fetchRawTxs('0xABCD')

      expect(result.pageInfo).toEqual(
        mockTokenTxs.data.tokenTransferTxs.pageInfo,
      )
      expect(result.transactions).toHaveLength(
        mockTokenTxs.data.tokenTransferTxs.edges.length,
      )
      expect(
        result.transactions.every((tx) => tx instanceof BlockscoutTransaction),
      ).toBeTruthy()
      expect(mockDataSourcePost).toHaveBeenCalledWith('', {
        query: expect.any(String),
        variables: { address: '0xabcd', afterCursor: undefined },
      })
    })

    it('fetches transactions from blockscout graphql if after cursor is set', async () => {
      const result = await datasource.fetchRawTxs('0xABCD', 'after-cursor')

      expect(result.pageInfo).toEqual(
        mockTokenTxs.data.tokenTransferTxs.pageInfo,
      )
      expect(result.transactions).toHaveLength(
        mockTokenTxs.data.tokenTransferTxs.edges.length,
      )
      expect(
        result.transactions.every((tx) => tx instanceof BlockscoutTransaction),
      ).toBeTruthy()
      expect(mockDataSourcePost).toHaveBeenCalledWith('', {
        query: expect.any(String),
        variables: { address: '0xabcd', afterCursor: 'after-cursor' },
      })
    })
  })

  describe('classifyTxs', () => {
    it('classifies and aggregates all transactions for version above 1.39.0', async () => {
      const { transactions } = await datasource.fetchRawTxs(
        '0x0000000000000000000000000000000000007E57',
      )
      const classifiedTxs = datasource.classifyTxs(
        '0x0000000000000000000000000000000000007E57',
        transactions,
        '1.40.0',
      )

      // 2 of the 24 raw txs are filtered because of unknown tokens and the rest aggregate to 19
      expect(classifiedTxs).toHaveLength(19)
      ;[
        ExchangeTokenToCelo,
        ExchangeCeloToToken,
        TokenSent,
        TokenSent,
        TokenSent,
        TokenReceived,
        TokenSent,
        TokenSent,
        TokenReceived,
        TokenReceived,
        EscrowSent,
        EscrowReceived,
        TokenSent,
        ContractCall,
        TokenSent,
        ContractCall,
        NftReceived,
        NftSent,
        SwapTransaction,
      ].forEach((txType, index) => {
        expect(classifiedTxs[index].transaction).toBeInstanceOf(
          BlockscoutTransaction,
        )
        expect(classifiedTxs[index].transactionType).toBeInstanceOf(txType)
      })
    })

    it('excludes swap and includes NFT txs on version 1.38.0', async () => {
      const { transactions } = await datasource.fetchRawTxs(
        '0x0000000000000000000000000000000000007E57',
      )
      const classifiedTxs = datasource.classifyTxs(
        '0x0000000000000000000000000000000000007E57',
        transactions,
        '1.38.0',
      )

      // swap is still included
      expect(classifiedTxs).toHaveLength(19)
      ;[
        ExchangeTokenToCelo,
        ExchangeCeloToToken,
        TokenSent,
        TokenSent,
        TokenSent,
        TokenReceived,
        TokenSent,
        TokenSent,
        TokenReceived,
        TokenReceived,
        EscrowSent,
        EscrowReceived,
        TokenSent,
        ContractCall,
        TokenSent,
        ContractCall,
        NftReceived,
        NftSent,
        Any,
      ].forEach((txType, index) => {
        expect(classifiedTxs[index].transaction).toBeInstanceOf(
          BlockscoutTransaction,
        )
        expect(classifiedTxs[index].transactionType).toBeInstanceOf(txType)
      })
    })

    it('excludes swap and NFT txs on versions below 1.38.0', async () => {
      const { transactions } = await datasource.fetchRawTxs(
        '0x0000000000000000000000000000000000007E57',
      )
      const classifiedTxs = datasource.classifyTxs(
        '0x0000000000000000000000000000000000007E57',
        transactions,
        '1.30.0',
      )

      // swap is still included
      expect(classifiedTxs).toHaveLength(17)
      ;[
        ExchangeTokenToCelo,
        ExchangeCeloToToken,
        TokenSent,
        TokenSent,
        TokenSent,
        TokenReceived,
        TokenSent,
        TokenSent,
        TokenReceived,
        TokenReceived,
        EscrowSent,
        EscrowReceived,
        TokenSent,
        ContractCall,
        TokenSent,
        ContractCall,
        Any,
      ].forEach((txType, index) => {
        expect(classifiedTxs[index].transaction).toBeInstanceOf(
          BlockscoutTransaction,
        )
        expect(classifiedTxs[index].transactionType).toBeInstanceOf(txType)
      })
    })

    it('excludes swap and NFT txs if no version is set', async () => {
      const { transactions } = await datasource.fetchRawTxs(
        '0x0000000000000000000000000000000000007E57',
      )
      const classifiedTxs = datasource.classifyTxs(
        '0x0000000000000000000000000000000000007E57',
        transactions,
      )

      // swap is still included
      expect(classifiedTxs).toHaveLength(17)
      ;[
        ExchangeTokenToCelo,
        ExchangeCeloToToken,
        TokenSent,
        TokenSent,
        TokenSent,
        TokenReceived,
        TokenSent,
        TokenSent,
        TokenReceived,
        TokenReceived,
        EscrowSent,
        EscrowReceived,
        TokenSent,
        ContractCall,
        TokenSent,
        ContractCall,
        Any,
      ].forEach((txType, index) => {
        expect(classifiedTxs[index].transaction).toBeInstanceOf(
          BlockscoutTransaction,
        )
        expect(classifiedTxs[index].transactionType).toBeInstanceOf(txType)
      })
    })
  })
})
