import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import {
  configs as exchangesConfigs,
  createNewManager,
} from '@valora/exchanges'
import { loadSecret } from '@valora/secrets-loader'
import express from 'express'
import promBundle from 'express-prom-bundle'
import yargs from 'yargs'
import { initApolloServer } from './apolloServer'
import { cronRouter } from './crons'
import CurrencyConversionAPI from './currencyConversion/CurrencyConversionAPI'
import ExchangeRateAPI from './currencyConversion/ExchangeRateAPI'
import { initDatabase } from './database/db'
import knownAddressesCache from './helpers/KnownAddressesCache'
import tokenInfoCache from './helpers/TokenInfoCache'
import { logger } from './logger'
import PricesService from './prices/PricesService'
import { AlchemyDataSourceManager } from './datasource/alchemy/AlchemyDataSource'
import { Config, AlchemyChain, DeployEnv } from './types'
import { ALCHEMY_ENV_NETWORK_MAP } from './config'

const metricsMiddleware = promBundle({ includeMethod: true, includePath: true })

const GRAPHQL_PATH: string = '/'

async function parseArgs(): Promise<Config> {
  //
  // Load secrets from Secrets Manager and inject into process.env.
  //
  const secretNames = process.env.SECRET_NAMES?.split(',') ?? []
  for (const secretName of secretNames) {
    Object.assign(process.env, await loadSecret(secretName))
  }

  const argv = await yargs
    .env('')
    .option('port', {
      description: 'Port to listen on',
      type: 'number',
      default: 8080,
    })
    .option('exchanges-network-config', {
      description: 'Blockchain network config for exchanges',
      choices: Object.keys(exchangesConfigs),
      type: 'string',
      demandOption: true,
    })
    .option('alchemy-ethereum-api-key', {
      description: 'Ethereum API key for Alchemy',
      type: 'string',
      demandOption: true,
    })
    .option('exchange-rates-api-access-key', {
      description: 'API key for exchange-rates-api',
      type: 'string',
      demandOption: true,
    })
    .option('blockchain-db-host', {
      group: 'Blockchain DB:',
      description: 'Blockchain DB host',
      type: 'string',
      demandOption: true,
    })
    .option('blockchain-db-database', {
      group: 'Blockchain DB:',
      description: 'Blockchain DB database',
      type: 'string',
      demandOption: true,
    })
    .option('blockchain-db-user', {
      group: 'Blockchain DB:',
      description: 'Blockchain DB user',
      type: 'string',
      demandOption: true,
    })
    .option('blockchain-db-pass', {
      group: 'Blockchain DB:',
      description: 'Blockchain DB pass',
      type: 'string',
      demandOption: true,
    })
    .option('sentry-dsn', {
      description: 'Sentry DSN',
      type: 'string',
    })
    .option('sentry-traces-sample-rate', {
      description: 'Sentry traces sample rate',
      type: 'number',
      default: 1.0,
    })
    .option('deploy-env', {
      description: 'Deploy environment',
      choices: Object.values(DeployEnv),
      demandOption: true,
    })
    .epilogue(
      'Always specify arguments as environment variables. Not all arguments are supported as CLI ones yet.',
    ).argv

  const deployEnv = argv['deploy-env']
  return {
    port: argv.port,
    deployEnv,
    exchangesNetworkConfig: argv['exchanges-network-config'],
    alchemyApiKeys: {
      [AlchemyChain.Ethereum]: argv['alchemy-ethereum-api-key'],
    },
    alchemyNetworkMap: ALCHEMY_ENV_NETWORK_MAP[deployEnv],
    exchangeRateApiKey: argv['exchange-rates-api-access-key'],
    db: {
      host: argv['blockchain-db-host'],
      database: argv['blockchain-db-database'],
      user: argv['blockchain-db-user'],
      password: argv['blockchain-db-pass'],
    },
    sentry: {
      dsn: argv['sentry-dsn'],
      tracesSampleRate: argv['sentr-traces-sample-rate'] as number,
    },
  }
}

async function main() {
  const config = await parseArgs()
  const app = express()

  // The Sentry documentation recommends initializing as early in your app as
  // possible.
  const sentryEnabled = !!config.sentry.dsn
  if (sentryEnabled) {
    Sentry.init({
      dsn: config.sentry.dsn,
      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express({ app }),
      ],
      tracesSampleRate: config.sentry.tracesSampleRate,
    })

    app.use(Sentry.Handlers.requestHandler())
    app.use(Sentry.Handlers.tracingHandler())
  }

  const db = await initDatabase({
    client: 'pg',
    connection: config.db,
  })

  const network = config.exchangesNetworkConfig
  let exchangeRateConfig = exchangesConfigs[network]
  if (network === 'mainnet') {
    exchangeRateConfig = {
      ...exchangeRateConfig,
      ubeswap: {
        ...exchangeRateConfig.ubeswap,
        // cREAL liquidity dropped below 20k on 2023-02-16, so we're lowering the threshold for now
        minLiquidity: 10_000,
      },
    }
  }
  const exchangeRateManager = createNewManager(exchangeRateConfig)

  knownAddressesCache.startListening()
  tokenInfoCache.startListening()

  const exchangeRateAPI = new ExchangeRateAPI({
    exchangeRatesAPIAccessKey: config.exchangeRateApiKey,
  })
  const currencyConversionAPI = new CurrencyConversionAPI({ exchangeRateAPI })
  const pricesService = new PricesService(
    db,
    exchangeRateAPI,
    exchangeRateManager.cUSDTokenAddress,
  )

  app.use(metricsMiddleware)

  // What is this? lol
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain')
    res.send('User-agent: *\nDisallow: /')
  })

  app.head('/', (_req, res) => {
    // Preventing HEAD requests made by some browsers causing alerts
    // https://github.com/celo-org/celo-monorepo/issues/2189
    res.end()
  })

  app.use('/cron', cronRouter({ db, pricesService, exchangeRateManager }))

  const alchemyDataSourceManager = new AlchemyDataSourceManager({
    alchemyNetworkMap: config.alchemyNetworkMap,
    alchemyApiKeys: config.alchemyApiKeys,
  })
  const apolloServer = initApolloServer({
    currencyConversionAPI,
    pricesService,
    alchemyDataSourceManager,
  })
  await apolloServer.start()
  apolloServer.applyMiddleware({ app, path: GRAPHQL_PATH })

  if (sentryEnabled) {
    // The Sentry error handler must be before any other error middleware and
    // after all controllers
    app.use(Sentry.Handlers.errorHandler())
  }

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      logger.error({ type: 'UNEXPECTED_ERROR', err })
      res.statusCode = 500
      if (sentryEnabled) {
        res.end((res as any).sentry + '\n')
      }
    },
  )

  app.listen(config.port, () => {
    logger.info(`Listening on port ${config.port}`)
    logger.info(`GraphQL path ${apolloServer.graphqlPath}`)
  })
}

main().catch((err) => {
  logger.error({
    type: 'STARTUP',
    err,
  })
  process.exit(1)
})
