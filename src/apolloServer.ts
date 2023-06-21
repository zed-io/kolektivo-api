import { ApolloServer } from 'apollo-server-express'
import { BlockscoutAPI } from './blockscout'
import { BlockscoutJsonAPI } from './blockscoutJsonApi'
import CurrencyConversionAPI from './currencyConversion/CurrencyConversionAPI'
import { logger } from './logger'
import PricesService from './prices/PricesService'
import { resolvers } from './resolvers'
import typeDefs from './schema'
import { getValoraVersionFromUserAgent } from './utils'
import { AlchemyDataSource } from './datasource/alchemy/AlchemyDataSource'
import { Chain } from './types'
import { BlockchainDataSource } from './blockchain'

export interface DataSources {
  blockscoutAPI: BlockscoutAPI
  blockscoutJsonAPI: BlockscoutJsonAPI
  currencyConversionAPI: CurrencyConversionAPI
  pricesService: PricesService
  ethereumDataSource: AlchemyDataSource
  blockchain: BlockchainDataSource
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
        ethereumDataSource: new AlchemyDataSource(Chain.Ethereum),
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
