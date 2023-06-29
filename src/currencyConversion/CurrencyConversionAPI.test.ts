import { InMemoryLRUCache } from 'apollo-server-caching'
import BigNumber from 'bignumber.js'
import CurrencyConversionAPI from './CurrencyConversionAPI'
import ExchangeRateAPI from './ExchangeRateAPI'
import GoldExchangeRateAPI from './GoldExchangeRateAPI'
import BitmamaAPI from './BitmamaAPI'

jest.mock('./ExchangeRateAPI')
jest.mock('./GoldExchangeRateAPI')
jest.mock('./BitmamaAPI')

const mockDefaultGetExchangeRate = ExchangeRateAPI.prototype
  .getExchangeRate as jest.Mock
mockDefaultGetExchangeRate.mockResolvedValue(new BigNumber(20))

const mockGoldGetExchangeRate = GoldExchangeRateAPI.prototype
  .getExchangeRate as jest.Mock
mockGoldGetExchangeRate.mockResolvedValue(new BigNumber(10))

const mockBitmamaGetExchangeRate = BitmamaAPI.prototype
  .getExchangeRate as jest.Mock
mockBitmamaGetExchangeRate.mockResolvedValue(new BigNumber(200))
describe('CurrencyConversionAPI', () => {
  let currencyConversionAPI: CurrencyConversionAPI

  beforeEach(() => {
    jest.clearAllMocks()
    const exchangeRateAPI = new ExchangeRateAPI({
      exchangeRatesAPIAccessKey: 'FOO',
    })
    const bitmamaAPI = new BitmamaAPI('https://bitmama.url')
    currencyConversionAPI = new CurrencyConversionAPI({
      exchangeRateAPI,
      bitmamaAPI,
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
    expect(result).toEqual(new BigNumber(10))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for cUSD/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cUSD',
      currencyCode: 'cGLD',
    })
    expect(result).toEqual(new BigNumber(10))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(1)
  })

  it('should retrieve rate for cGLD/USD', async () => {
    const impliedExchangeRates = { 'cGLD/cUSD': new BigNumber(10) }
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'USD',
      impliedExchangeRates,
    })
    expect(result).toEqual(new BigNumber(10))

    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for USD/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'USD',
      currencyCode: 'cGLD',
    })
    expect(result).toEqual(new BigNumber(10))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(1)
  })

  it('should retrieve rate for cGLD/MXN', async () => {
    const impliedExchangeRates = { 'cGLD/cUSD': new BigNumber(10) }
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'MXN',
      impliedExchangeRates,
    })
    expect(result).toEqual(new BigNumber(200))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for MXN/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'MXN',
      currencyCode: 'cGLD',
    })
    expect(result).toEqual(new BigNumber(200))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(1)
  })

  it('should retrieve rate for USD/MXN', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'USD',
      currencyCode: 'MXN',
    })
    expect(result).toEqual(new BigNumber(20))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for USD/NGN', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'USD',
      currencyCode: 'NGN',
    })
    expect(result).toEqual(new BigNumber(200))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockBitmamaGetExchangeRate).toHaveBeenCalledTimes(1)
  })

  it('should retrieve rate for MXN/USD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'MXN',
      currencyCode: 'USD',
    })
    expect(result).toEqual(new BigNumber(20))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for cUSD/MXN', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cUSD',
      currencyCode: 'MXN',
    })
    expect(result).toEqual(new BigNumber(20))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for MXN/cUSD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'MXN',
      currencyCode: 'cUSD',
    })
    expect(result).toEqual(new BigNumber(20))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should return 1 when using the same currency code', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'ABC',
      currencyCode: 'ABC',
    })
    expect(result).toEqual(new BigNumber(1))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for cGLD/EUR', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'EUR',
    })
    expect(result).toEqual(new BigNumber(200))

    expect(mockGoldGetExchangeRate).toHaveBeenCalledWith({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'cUSD',
    })
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledWith({
      sourceCurrencyCode: 'USD',
      currencyCode: 'EUR',
    })
  })

  it('should retrieve rate for EUR/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'EUR',
      currencyCode: 'cGLD',
    })
    expect(result).toEqual(new BigNumber(200))

    expect(mockDefaultGetExchangeRate).toHaveBeenCalledWith({
      sourceCurrencyCode: 'EUR',
      currencyCode: 'USD',
    })
    expect(mockGoldGetExchangeRate).toHaveBeenCalledWith({
      sourceCurrencyCode: 'cUSD',
      currencyCode: 'cGLD',
    })
  })
})
