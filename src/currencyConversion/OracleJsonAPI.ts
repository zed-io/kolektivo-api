import { RESTDataSource } from 'apollo-datasource-rest'
import { metrics } from '../metrics'
import { COINGECKO_API } from '../config'
import { enumValueForKey, getCurrency, supportedOracleTokens } from './consts'
import BigNumber from 'bignumber.js'
import { logger } from '../logger'
import { CurrencyConversionArgs } from '../resolvers'
import { formatDateStringShort } from '../utils'

interface OracleApiResult {
  market_data: { current_price: { [currencyCode: string]: number } }
}

const MIN_TTL = 12 * 3600 // 12 hours

export default class OracleJsonAPI extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = `${COINGECKO_API}`
  }

  async getExchangeRate({
    sourceCurrencyCode,
    currencyCode,
    timestamp,
  }: CurrencyConversionArgs): Promise<BigNumber> {
    try {
      const pair = `${sourceCurrencyCode}/${currencyCode}`
      const rates = await this.getOracleRate(
        sourceCurrencyCode || supportedOracleTokens.cUSD,
        currencyCode,
        timestamp,
      )
      const payload = Object.assign({}, rates.market_data.current_price)
      if (!payload[getCurrency(currencyCode)]) {
        throw new Error(`Unable to get rate for pair: ${pair}`)
      }
      return new BigNumber(payload[getCurrency(currencyCode)])
    } catch (error) {
      logger.error({
        type: 'ERROR_UPDATING_ORACLE_PRICES',
        error: error,
      })
      throw error
    }
  }

  async getOracleRate(
    sourceCurrencyCode: string,
    currencyCode: string,
    timestamp: number = Date.now(),
  ): Promise<OracleApiResult> {
    const t0 = performance.now()
    const date = new Date(Date.now())
    const path = `/coins/${enumValueForKey(
      supportedOracleTokens,
      sourceCurrencyCode,
    )}/history`
    const params = {
      date: formatDateStringShort(new Date(timestamp)),
    }
    const result = await this.get<OracleApiResult>(path, params, {
      cacheOptions: { ttl: this.getCacheTtl(date) },
    })
    if (Object.is(result, {})) {
      throw new Error(`Invalid response from oracle: ${JSON.stringify(result)}`)
    }
    const t1 = performance.now()
    metrics.setQueryOracleRateDuration(t1 - t0)
    return result
  }

  private getCacheTtl(date: Date) {
    if (Date.now() - date.getTime() >= 24 * 3600 * 1000) {
      // Cache indefinitely if requesting a date prior to the last 24 hours
      return Number.MAX_SAFE_INTEGER
    } else {
      return MIN_TTL
    }
  }
}
