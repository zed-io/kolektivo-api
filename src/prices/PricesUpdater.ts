import { Knex } from 'knex'
import { logger } from '../logger'

import { ExchangeRateManager, PriceByAddress } from '@valora/exchanges'
import { updateFirebase } from '../firebase'
import tokenInfoCache, { TokenInfo } from '../helpers/TokenInfoCache'
import PricesService from './PricesService'
import asyncPool from 'tiny-async-pool'
import { KG } from '../currencyConversion/consts'
import BigNumber from 'bignumber.js'

const FIREBASE_NODE_KEY = '/tokensInfo'
const MAX_CONCURRENCY = 30
export const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

function addPeggedPrices(prices: PriceByAddress) {
  const returnedPrices = { ...prices }
  tokenInfoCache.getTokensInfo().forEach((token: TokenInfo) => {
    if (token.pegTo && prices[token.pegTo]) {
      returnedPrices[token.address] = prices[token.pegTo]
    }
  })

  return returnedPrices
}

export async function updateCurrentPrices({
  exchangeRateManager,
}: {
  exchangeRateManager: ExchangeRateManager,
}) {
  logger.info('Updating current prices in firebase')

  const fetchTime = Date.now()
  const prices = addPeggedPrices(
    await exchangeRateManager.calculatecUSDPrices(),
  )

  const kGPrice = new BigNumber(1/ 1.8); // @note Hardcoded ANGUSD

  const tokensInfo: TokenInfo[] = tokenInfoCache.getTokensInfo()

  const updateObject = tokensInfo.reduce(
    (result: any, tokenInfo: TokenInfo) => {
      const { address, symbol } = tokenInfo;
      const price = prices[address.toLowerCase()]

      if (price) {
        result[`${address}/usdPrice`] = price.toString()
        result[`${address}/priceFetchedAt`] = fetchTime
      } else if (symbol === KG) {
        result[`${address}/usdPrice`] = kGPrice.toString()
        result[`${address}/priceFetchedAt`] = fetchTime
      }
      return result
    },
    {},
  )

  await updateFirebase(FIREBASE_NODE_KEY, updateObject)
  logger.info('Updated current prices in firebase')
}

export async function updateHistoricalPrices({
  pricesService,
}: {
  pricesService: PricesService
}) {
  logger.info('Updating historical prices in firebase')
  const tokensInfo = tokenInfoCache.getTokensInfo()

  await updateLastDayPrices(pricesService, tokensInfo)
  logger.info('Updated historical prices in firebase')
}

async function updateLastDayPrices(
  pricesService: PricesService,
  tokensInfo: TokenInfo[],
) {
  const lastDay = new Date(Date.now() - 1 * ONE_DAY_IN_MS)
  await asyncPool(
    MAX_CONCURRENCY,
    tokensInfo,
    async (tokenInfo: TokenInfo) => {
      try {
        const {address, symbol} = tokenInfo;
        let lastDayPrice = await pricesService.getTokenTocUSDPrice(
          address,
          lastDay,
        )
        if (symbol == KG) {
          lastDayPrice = new BigNumber(1/1.8) // @note Hardcoded ANGUSD
        }
        await updateFirebase(
          `${FIREBASE_NODE_KEY}/${address}/historicalUsdPrices/lastDay`,
          {
            price: lastDayPrice.toString(),
            at: lastDay.getTime(),
          },
        )
      } catch (error) {
        logger.warn({
          type: 'ERROR_UPDATING_LAST_DAY_PRICE',
          tokenInfo,
          error,
        })
      }
    },
  )
}

export async function storeHistoricalPrices({
  db,
  exchangeRateManager,
}: {
  db: Knex
  exchangeRateManager: ExchangeRateManager
}) {
  logger.info('Storing historical prices')

  const fetchTime = new Date(Date.now())
  const prices = addPeggedPrices(
    await exchangeRateManager.calculatecUSDPrices(),
  )
  const cUSDAddress = exchangeRateManager.cUSDTokenAddress

  const batchInsertItems = Object.entries(prices)
    .filter(([token, _]) => token !== cUSDAddress)
    .map(([token, price]) => ({
      token,
      base_token: cUSDAddress,
      price: price.toString(),
      at: fetchTime.toISOString(),
      fetched_from: 'Exchange library',
    }))

  await db('historical_token_prices')
    .insert(batchInsertItems)
    .catch((error) => {
      logger.error({
        type: 'ERROR_INSERTING_TOKEN_PRICES',
        error,
      })
    })

  logger.info('Stored historical prices')
}
