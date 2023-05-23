import { ApolloServer } from 'apollo-server-express'
import { BlockscoutAPI } from './blockscout'
import { BlockscoutJsonAPI } from './blockscoutJsonApi'
import CurrencyConversionAPI from './currencyConversion/CurrencyConversionAPI'
import { logger } from './logger'
import PricesService from './prices/PricesService'
import { resolvers } from './resolvers'
import typeDefs from './schema'
import { getValoraVersionFromUserAgent } from './utils'

export interface DataSources {
  blockscoutAPI: BlockscoutAPI
  blockscoutJsonAPI: BlockscoutJsonAPI
  currencyConversionAPI: CurrencyConversionAPI
  pricesService: PricesService
}

export function initApolloServer({
  currencyConversionAPI,
  pricesService,
}: {
  currencyConversionAPI: CurrencyConversionAPI
  pricesService: PricesService
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
      }
    },
    context: ({ req }) => ({
      valoraVersion: getValoraVersionFromUserAgent(req.header('user-agent')),
    }),
    formatError: (error) => {
      logger.error({
        type: 'UNHANDLED_ERROR',
        error: error,
      })
      return error
    },
  })
}
