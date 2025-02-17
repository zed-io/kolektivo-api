import { InMemoryLRUCache } from 'apollo-server-caching'
import BigNumber from 'bignumber.js'
import CurrencyConversionAPI from './CurrencyConversionAPI'
import ExchangeRateAPI from './ExchangeRateAPI'
import GoldExchangeRateAPI from './GoldExchangeRateAPI'
import OracleJsonAPI from './OracleJsonAPI'

jest.mock('./ExchangeRateAPI')
jest.mock('./GoldExchangeRateAPI')
jest.mock('./OracleJsonAPI')

const mockDefaultGetExchangeRate = ExchangeRateAPI.prototype
  .getExchangeRate as jest.Mock
mockDefaultGetExchangeRate.mockResolvedValue(new BigNumber(20))

const mockDefaultGetOracleRate = OracleJsonAPI.prototype
  .getExchangeRate as jest.Mock
mockDefaultGetOracleRate.mockResolvedValue(new BigNumber(15))

const mockGoldGetExchangeRate = GoldExchangeRateAPI.prototype
  .getExchangeRate as jest.Mock
mockGoldGetExchangeRate.mockResolvedValue(new BigNumber(10))

describe('CurrencyConversionAPI', () => {
  let currencyConversionAPI: CurrencyConversionAPI

  beforeEach(() => {
    jest.clearAllMocks()
    const exchangeRateAPI = new ExchangeRateAPI({
      exchangeRatesAPIAccessKey: 'FOO',
    })
    const oracle = new OracleJsonAPI()
    currencyConversionAPI = new CurrencyConversionAPI({
      exchangeRateAPI,
      oracle,
    })
    currencyConversionAPI.initialize({
      context: {},
      cache: new InMemoryLRUCache(),
    })
  })

  it('should retrieve rate for cGLD/cUSD', async () => {
    const impliedExchangeRates = { 'cGLD/cUSD': new BigNumber(10) }
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'cUSD',
      impliedExchangeRates,
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(0)
    expect(result).toEqual(new BigNumber(10))
  })

  it('should retrieve rate for cUSD/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cUSD',
      currencyCode: 'cGLD',
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(1)
    expect(result).toEqual(new BigNumber(15))
  })

  it('should retrieve rate for cGLD/USD', async () => {
    const impliedExchangeRates = { 'cGLD/USD': new BigNumber(10) }
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'USD',
      impliedExchangeRates,
    })

    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(0)
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(result).toEqual(new BigNumber(10))
  })

  it('should retrieve rate for USD/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'USD',
      currencyCode: 'cGLD',
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(1)
    expect(result).toEqual(new BigNumber(15))
  })

  it('should retrieve rate for cGLD/MXN', async () => {
    const impliedExchangeRates = { 'cGLD/USD': new BigNumber(10) }
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'MXN',
      impliedExchangeRates,
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(0)
    expect(result).toEqual(new BigNumber(200))
  })

  it('should retrieve rate for MXN/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'MXN',
      currencyCode: 'cGLD',
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(1)
    expect(result).toEqual(new BigNumber(300))
  })

  it('should retrieve rate for USD/MXN', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'USD',
      currencyCode: 'MXN',
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(0)
    expect(result).toEqual(new BigNumber(20))
  })

  it('should retrieve rate for MXN/USD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'MXN',
      currencyCode: 'USD',
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(0)
    expect(result).toEqual(new BigNumber(20))
  })

  it('should retrieve rate for cUSD/MXN', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cUSD',
      currencyCode: 'MXN',
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(0)
    expect(result).toEqual(new BigNumber(20))
  })

  it('should retrieve rate for MXN/cUSD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'MXN',
      currencyCode: 'cUSD',
    })
    expect(result).toEqual(new BigNumber(20))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(0)
    expect(result).toEqual(new BigNumber(20))
  })

  it('should return 1 when using the same currency code', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'ABC',
      currencyCode: 'ABC',
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockDefaultGetOracleRate).toHaveBeenCalledTimes(0)
    expect(result).toEqual(new BigNumber(1))
  })

  it('should retrieve rate for cGLD/EUR', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'EUR',
    })

    expect(mockDefaultGetOracleRate).toHaveBeenCalledWith({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'USD',
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledWith({
      sourceCurrencyCode: 'USD',
      currencyCode: 'EUR',
    })
    expect(result).toEqual(new BigNumber(300))
  })

  it('should retrieve rate for EUR/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'EUR',
      currencyCode: 'cGLD',
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledWith({
      sourceCurrencyCode: 'EUR',
      currencyCode: 'USD',
    })
    expect(mockDefaultGetOracleRate).toHaveBeenCalledWith({
      sourceCurrencyCode: 'USD',
      currencyCode: 'cGLD',
    })
    expect(result).toEqual(new BigNumber(300))
  })

  it('should retrieve rate for cGLD/cEUR', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'cEUR',
    })
    expect(mockDefaultGetOracleRate).toHaveBeenCalledWith({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'USD',
    })
    expect(mockDefaultGetOracleRate).toHaveBeenCalledWith({
      sourceCurrencyCode: 'USD',
      currencyCode: 'cEUR',
    })
    expect(result).toEqual(new BigNumber(15 * 15))
  })

  it('should retrieve rate for cEUR/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cEUR',
      currencyCode: 'cGLD',
    })
    expect(mockDefaultGetOracleRate.mock.calls).toEqual([
      [
        {
          currencyCode: 'USD',
          sourceCurrencyCode: 'cEUR',
          timestamp: undefined,
        },
      ],
      [
        {
          currencyCode: 'cGLD',
          sourceCurrencyCode: 'USD',
          timestamp: undefined,
        },
      ]
    ])
    expect(result).toEqual(new BigNumber(15 * 15))
  })

  it('should retrieve rate for TTD/cEUR', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      currencyCode: 'TTD',
      sourceCurrencyCode: 'cEUR',
    })

    expect(mockDefaultGetExchangeRate).toHaveBeenCalledWith({
      currencyCode: 'TTD',
      sourceCurrencyCode: 'USD',
    })
    expect(mockDefaultGetOracleRate).toHaveBeenCalledWith({
      currencyCode: 'USD',
      sourceCurrencyCode: 'cEUR',
    })
    expect(result).toEqual(new BigNumber(300))
  })

  it('should retrieve rate for TTD/GBP', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      currencyCode: 'TTD',
      sourceCurrencyCode: 'GBP',
    })

    expect(mockDefaultGetExchangeRate).toHaveBeenCalledWith({
      currencyCode: 'TTD',
      sourceCurrencyCode: 'GBP',
    })

    expect(result).toEqual(new BigNumber(20))
  })
})
