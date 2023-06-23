import { ApolloServer } from 'apollo-server-express'
import { BlockscoutAPI } from './blockscout'
import { BlockscoutJsonAPI } from './blockscoutJsonApi'
import CurrencyConversionAPI from './currencyConversion/CurrencyConversionAPI'
import { logger } from './logger'
import PricesService from './prices/PricesService'
import { resolvers } from './resolvers'
import typeDefs from './schema'
import { getValoraVersionFromUserAgent } from './utils'
import { AlchemyDataSourceManager } from './datasource/alchemy/AlchemyDataSource'
import { BlockchainDataSource } from './blockchain'

export interface DataSources {
  blockscoutAPI: BlockscoutAPI
  blockscoutJsonAPI: BlockscoutJsonAPI
  currencyConversionAPI: CurrencyConversionAPI
  pricesService: PricesService
  alchemyDataSourceManager: AlchemyDataSourceManager
  blockchain: BlockchainDataSource
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
        blockscoutAPI: new BlockscoutAPI(),
        blockscoutJsonAPI: new BlockscoutJsonAPI(),
        currencyConversionAPI,
        pricesService,
        alchemyDataSourceManager,
        blockchain: new BlockchainDataSource(),
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
