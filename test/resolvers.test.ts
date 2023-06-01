import { resolvers, Context } from '../src/resolvers'
import { DataSources } from '../src/apolloServer'
import { TokenTransactionV2Args, Chain } from '../src/types'

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
})
