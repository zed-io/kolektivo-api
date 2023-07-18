import { ApolloServer } from 'apollo-server-express'
import { LegacyBlockscoutAPI } from './legacyBlockscout'
import { BlockscoutJsonAPI } from './blockscoutJsonApi'
import CurrencyConversionAPI from './currencyConversion/CurrencyConversionAPI'
import { logger } from './logger'
import PricesService from './prices/PricesService'
import { resolvers } from './resolvers'
import typeDefs from './schema'
import { getValoraVersionFromUserAgent } from './utils'
import { AlchemyDataSourceManager } from './datasource/alchemy/AlchemyDataSource'
import { BlockchainDataSource } from './blockchain'
import { BlockscoutDataSource } from './datasource/blockscout/BlockscoutDataSource'

export interface DataSources {
  legacyBlockscoutAPI: LegacyBlockscoutAPI // the data source which hits the graphql endpoint, used for fetching token transactions v1
  blockscoutJsonAPI: BlockscoutJsonAPI // the  data source which hits the json api, used for token balances
  currencyConversionAPI: CurrencyConversionAPI
  pricesService: PricesService
  alchemyDataSourceManager: AlchemyDataSourceManager
  blockchain: BlockchainDataSource
  blockscout: BlockscoutDataSource // the data source which implements the base data source and hits the graphql endpoint, used for fetching token transactions v2
}

export function initApolloServer({
  currencyConversionAPI,
  pricesService,
  alchemyDataSourceManager,
}: {
  currencyConversionAPI: CurrencyConversionAPI
  pricesService: PricesService
  alchemyDataSourceManager: AlchemyDataSourceManager
}) {
  return new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => {
      return {
        legacyBlockscoutAPI: new LegacyBlockscoutAPI(),
        blockscoutJsonAPI: new BlockscoutJsonAPI(),
        currencyConversionAPI,
        pricesService,
        alchemyDataSourceManager,
        blockchain: new BlockchainDataSource(),
        blockscout: new BlockscoutDataSource(),
      }
    },
    context: ({ req }) => ({
      valoraVersion: getValoraVersionFromUserAgent(req.header('user-agent')),
    }),
    formatError: (err) => {
      logger.error({
        type: 'UNHANDLED_ERROR',
        err,
      })
      return err
    },
  })
}
