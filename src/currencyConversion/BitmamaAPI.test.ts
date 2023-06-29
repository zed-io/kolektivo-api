import { InMemoryLRUCache } from 'apollo-server-caching'
import BitmamaAPI from './BitmamaAPI'
import fetchMock from 'jest-fetch-mock'
import BigNumber from 'bignumber.js'

const SUCCESS_RESULT = JSON.stringify({
  buy: 200,
  sell: 202,
})

fetchMock.mockResponse(SUCCESS_RESULT, {
  status: 200,
  headers: {
    'Content-type': 'application/json',
  },
})

describe('BitmamaAPI', () => {
  let bitmamaAPI: BitmamaAPI
  beforeEach(() => {
    bitmamaAPI = new BitmamaAPI('https://bitmama.url')
    bitmamaAPI.initialize({ context: {}, cache: new InMemoryLRUCache() })
    jest.clearAllMocks()
    fetchMock.mockClear()
  })
  it('should retrieve exchange rates for given currencies', async () => {
    const result = await bitmamaAPI.getExchangeRate({
      fromCurrencyCode: 'USD',
      toCurrencyCode: 'NGN',
    })
    expect(result).toEqual(new BigNumber(201))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('should return a cached value if the api call fails', async () => {
    fetchMock.mockResponse(SUCCESS_RESULT, {
      status: 200,
      headers: {
        'Content-type': 'application/json',
      },
    })
    await bitmamaAPI.getExchangeRate({
      fromCurrencyCode: 'USD',
      toCurrencyCode: 'NGN',
    })
    fetchMock.mockReject(new Error('API is down'))

    const result = await bitmamaAPI.getExchangeRate({
      fromCurrencyCode: 'USD',
      toCurrencyCode: 'NGN',
    })
    expect(result).toEqual(new BigNumber(201))
  })
  it('should throw if the api fails and there is no cached value for the pair', async () => {
    fetchMock.mockResponse(SUCCESS_RESULT, {
      status: 200,
      headers: {
        'Content-type': 'application/json',
      },
    })

    await bitmamaAPI.getExchangeRate({
      fromCurrencyCode: 'USD',
      toCurrencyCode: 'NGN',
    })
    fetchMock.mockReject(new Error('API is down'))

    await expect(() =>
      bitmamaAPI.getExchangeRate({
        fromCurrencyCode: 'EUR',
        toCurrencyCode: 'NGN',
      }),
    ).rejects.toThrow('API is down')
  })
})
