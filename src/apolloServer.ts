import { ApolloServer } from 'apollo-server-express'
import { BlockscoutAPI } from './blockscout'
import { BlockscoutJsonAPI } from './blockscoutJsonApi'
import CurrencyConversionAPI from './currencyConversion/CurrencyConversionAPI'
import OracleJsonAPI from './currencyConversion/OracleJsonAPI'
import { logger } from './logger'
import PricesService from './prices/PricesService'
import { resolvers } from './resolvers'
import typeDefs from './schema'

export interface DataSources {
  blockscoutAPI: BlockscoutAPI
  blockscoutJsonAPI: BlockscoutJsonAPI
  currencyConversionAPI: CurrencyConversionAPI
  pricesService: PricesService
  oracle: OracleJsonAPI
}

export function initApolloServer({
  currencyConversionAPI,
  pricesService,
  oracle,
}: {
  currencyConversionAPI: CurrencyConversionAPI
  pricesService: PricesService
  oracle: OracleJsonAPI
}) {
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    dataSources: () => {
      return {
        blockscoutAPI: new BlockscoutAPI(),
        blockscoutJsonAPI: new BlockscoutJsonAPI(),
        currencyConversionAPI,
        pricesService,
        oracle,
      }
    },
    formatError: (error) => {
      logger.error({
        type: 'UNHANDLED_ERROR',
        error: error,
      })
      return error
    },
  })
}
