import { RESTDataSource } from 'apollo-datasource-rest'
import { CELO, CGLD, CUSD, USD } from './consts'
import BigNumber from 'bignumber.js'
import { logger } from '../logger'
import { CurrencyConversionArgs } from '../resolvers'
import tokenInfoCache, { TokenInfo } from '../helpers/TokenInfoCache'

export default class OracleJsonAPI extends RESTDataSource {
  constructor() {
    super()
  }

  async getExchangeRate({
    sourceCurrencyCode,
    currencyCode,
    timestamp,
  }: CurrencyConversionArgs): Promise<BigNumber> {
    try {
      // Note: Can be any pair in `supportedPairs`
      const toToken = (sourceCurrencyCode === CGLD ? CELO : sourceCurrencyCode) || CUSD;
      const fromToken = currencyCode === CGLD ? CELO : currencyCode;
      const pair = `${sourceCurrencyCode}/${currencyCode}`
      // Note: If converting from cUSD -> X, 
      // then the rate needs to be inverted
      let rate;
      if (toToken === CUSD || toToken === USD) {
        rate = this.getFirebaseRate(fromToken)
      } else if (fromToken === CUSD || fromToken == USD) {
        const temp = await this.getFirebaseRate(toToken);
        rate = new BigNumber(1).dividedBy(temp)
      }
      
      if (!rate) {
        throw new Error(`Unable to get rate for pair: ${pair}`)
      }

      logger.info(rate.toString())
      return rate
    } catch (error) {
      logger.error({
        type: 'ERROR_FETCHING_ORACLE_PRICES',
        error: error,
      })
      throw error
    }
  }

  /**
   * This function returns the currently stored USD price of a 
   * given crypto asset by address.
   * 
   * e.g. cGLD -> USD = 13.034094
   * @param tokenAddress Address of Asset to return USD Price
   * @returns {Promise<BigNumber>}
   */
  async getFirebaseRate(
    currency: string,
  ): Promise<BigNumber> {
    logger.info(currency)
    const tokenInfo: TokenInfo | undefined = tokenInfoCache.tokenInfoBySymbol(currency)
    const usdPrice: BigNumber = new BigNumber(tokenInfo?.usdPrice ?? 0)
    logger.info(tokenInfo)
    return usdPrice;
  }
}
