import { resolvers, Context } from '../src/resolvers'
import { DataSources } from '../src/apolloServer'
import { TokenTransactionV2Args, Chain } from '../src/types'
import * as config from '../src/config'

const mockConfig = config as { FETCH_BALANCES_VIA_BLOCKSCOUT: boolean }

describe('resolvers', () => {
  describe('tokenTransactionsV2', () => {
    let context: Context
    let args: TokenTransactionV2Args

    beforeEach(() => {
      jest.resetAllMocks()
      context = {
        valoraVersion: '1.0.0',
        localCurrencyCode: 'USD',
        dataSources: {
          blockscoutAPI: {
            getTokenTransactionsV2: jest.fn().mockResolvedValue('celo'),
          },
          ethereumDataSource: {
            getTokenTxs: jest.fn().mockResolvedValue('ethereum'),
          },
        } as unknown as DataSources,
      }
      args = {
        address: 'some-address',
        localCurrencyCode: 'USD',
        afterCursor: 'after-cursor',
      }
    })

    it('defaults to Celo if no chain provided', async () => {
      const result = await resolvers.Query.tokenTransactionsV2(
        undefined,
        args,
        context,
      )
      expect(result).toEqual('celo')
      expect(
        context.dataSources.blockscoutAPI.getTokenTransactionsV2,
      ).toHaveBeenCalledTimes(1)
      expect(
        context.dataSources.blockscoutAPI.getTokenTransactionsV2,
      ).toHaveBeenCalledWith(
        args.address,
        args.afterCursor,
        context.valoraVersion,
      )
    })
    it('uses Blockscout if Celo chain selected', async () => {
      args.chain = Chain.Celo
      const result = await resolvers.Query.tokenTransactionsV2(
        undefined,
        args,
        context,
      )
      expect(result).toEqual('celo')
      expect(
        context.dataSources.blockscoutAPI.getTokenTransactionsV2,
      ).toHaveBeenCalledTimes(1)
      expect(
        context.dataSources.blockscoutAPI.getTokenTransactionsV2,
      ).toHaveBeenCalledWith(
        args.address,
        args.afterCursor,
        context.valoraVersion,
      )
    })
    it('uses Alchemy if Ethereum chain selected', async () => {
      args.chain = Chain.Ethereum
      const result = await resolvers.Query.tokenTransactionsV2(
        undefined,
        args,
        context,
      )
      expect(result).toEqual('ethereum')
      expect(
        context.dataSources.ethereumDataSource.getTokenTxs,
      ).toHaveBeenCalledTimes(1)
      expect(
        context.dataSources.ethereumDataSource.getTokenTxs,
      ).toHaveBeenCalledWith(
        args.address,
        args.afterCursor,
        context.valoraVersion,
      )
    })
    it('throws an error if unknown chain provided', async () => {
      args.chain = 'fake-chain' as Chain
      await expect(
        resolvers.Query.tokenTransactionsV2(undefined, args, context),
      ).rejects.toThrow('Unknown chain parameter: fake-chain')
    })
  })

  describe('userBalances', () => {
    let context: Context
    let args: { address: string }

    beforeEach(() => {
      jest.resetAllMocks()
      jest.mock('../src/config.ts', () => {
        return {
          __esModule: true,
          FETCH_BALANCES_VIA_BLOCKSCOUT: false,
        }
      })
      context = {
        valoraVersion: '1.0.0',
        dataSources: {
          blockchain: {
            fetchUserBalances: jest.fn().mockResolvedValue('blockchain'),
          },
          blockscoutJsonAPI: {
            fetchUserBalances: jest.fn().mockResolvedValue('blockscout'),
          },
        } as unknown as DataSources,
      }
      args = {
        address: 'some-address',
      }
    })

    it('queries the blockchain when FETCH_BALANCES_VIA_BLOCKSCOUT is false', async () => {
      mockConfig.FETCH_BALANCES_VIA_BLOCKSCOUT = false

      const result = await resolvers.Query.userBalances(
        undefined,
        args,
        context,
      )
      expect(result).toEqual({ balances: 'blockchain' })
      expect(
        context.dataSources.blockchain.fetchUserBalances,
      ).toHaveBeenCalledTimes(1)
      expect(
        context.dataSources.blockscoutJsonAPI.fetchUserBalances,
      ).toHaveBeenCalledTimes(0)
    })

    it('queries blockscout when FETCH_BALANCES_VIA_BLOCKSCOUT is true', async () => {
      mockConfig.FETCH_BALANCES_VIA_BLOCKSCOUT = true

      const result = await resolvers.Query.userBalances(
        undefined,
        args,
        context,
      )
      expect(result).toEqual({ balances: 'blockscout' })
      expect(
        context.dataSources.blockchain.fetchUserBalances,
      ).toHaveBeenCalledTimes(0)
      expect(
        context.dataSources.blockscoutJsonAPI.fetchUserBalances,
      ).toHaveBeenCalledTimes(1)
    })
  })
})
