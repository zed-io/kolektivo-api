import { RESTDataSource } from 'apollo-datasource-rest'
import BigNumber from 'bignumber.js'
import { logger } from '../logger'

interface BitmamaAPIResult {
  buy: number
  sell: number
}

// ttl in seconds!
const MIN_TTL = 10 * 60 // 10 mintues

/**
 * API Client for Bitmama's exchange rate API.
 *
 * Two types of caching are used:
 * - apollo-datasource-rest's built-in expiring cache is used to save a roundtrip and regulate our API usage
 * - a local, non-expiring cache is used as a fallback in case requests fail
 */
export default class BitmamaAPI extends RESTDataSource {
  private rateCache: Map<
    string,
    {
      rate: BigNumber
      timestamp: number
    }
  >
  constructor(baseUrl: string) {
    super()
    this.baseURL = baseUrl
    // Should be safe to not have an eviction policy here since we only cache NGN/USD rates
    // and even if we used all combinations of 200ish, the memory usage would be acceptable
    this.rateCache = new Map<
      string,
      {
        rate: BigNumber
        timestamp: number
      }
    >()
  }

  async getExchangeRate({
    fromCurrencyCode,
    toCurrencyCode,
  }: {
    fromCurrencyCode: string
    toCurrencyCode: string
  }): Promise<BigNumber> {
    try {
      const result = await this.get<BitmamaAPIResult>(
        '/rates/fiat',
        {
          from: fromCurrencyCode,
          to: toCurrencyCode,
        },
        {
          cacheOptions: {
            ttl: MIN_TTL, // Only actually call the API every MIN_TTL seconds so it doesn't get spammed
          },
        },
      )
      this.rateCache.set(`${fromCurrencyCode}-${toCurrencyCode}`, {
        rate: new BigNumber(result.buy),
        timestamp: Date.now(),
      })
      return new BigNumber(result.buy)
        .plus(new BigNumber(result.sell))
        .dividedBy(2)
    } catch (error) {
      logger.error({
        type: 'ERROR_FETCHING_BITMAMA_EXCHANGE_RATE',
        error,
      })
      // As a fallback, try to return the last cached rate
      const cachedRate = this.rateCache.get(
        `${fromCurrencyCode}-${toCurrencyCode}`,
      )
      if (cachedRate) {
        logger.info(
          `Using cached rate for ${fromCurrencyCode}-${toCurrencyCode} from ${cachedRate.timestamp}`,
        )
        return cachedRate.rate
      }
      throw error
    }
  }
}
