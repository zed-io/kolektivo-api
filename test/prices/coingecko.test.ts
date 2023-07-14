import {
  TIMEOUT,
  fetchPrices,
  fetchUsdPrices,
} from '../../src/prices/coingecko'
import { AlchemyChain, BlockscoutChain } from '../../src/types'

const baseToken = '0x765DE816845861e75A25fCA122bb6898B8B1282a'

const mockFetch = jest.fn()
jest.mock('../../src/helpers/fetchWithTimeout', () => ({
  fetchWithTimeout: (url: string, body: any, timeout: number) =>
    mockFetch(url, body, timeout),
}))

describe('fetchUsdPrices', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns usd prices when the request is successful', async () => {
    const mockResponse: Record<string, { usd: number }> = {
      '0x765DE816845861e75A25fCA122bb6898B8B1282a': { usd: 1.002 },
      '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787': { usd: 0.45 },
      '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73': { usd: 2.34 },
    }
    const mockAddresses = Object.keys(mockResponse)
    const mockFetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
    mockFetch.mockReturnValue(mockFetchPromise)

    const prices = await fetchUsdPrices(mockAddresses, BlockscoutChain.Celo)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.coingecko.com/api/v3/simple/token_price/celo?contract_addresses=0x765DE816845861e75A25fCA122bb6898B8B1282a,0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787,0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73&vs_currencies=usd`,
      TIMEOUT,
      undefined,
    )

    expect(prices).toMatchInlineSnapshot(`
    {
      "0x765DE816845861e75A25fCA122bb6898B8B1282a": "1.002",
      "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73": "2.34",
      "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787": "0.45",
    }
    `)
  })

  it('throws an error when the request times out', async () => {
    const mockFetchPromise = Promise.reject(new Error(`Request timed out`))
    mockFetch.mockReturnValue(mockFetchPromise)

    await expect(
      fetchUsdPrices(
        ['0x765DE816845861e75A25fCA122bb6898B8B1282a'],
        AlchemyChain.Ethereum,
      ),
    ).rejects.toThrowError('Request timed out')

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0x765DE816845861e75A25fCA122bb6898B8B1282a&vs_currencies=usd`,
      TIMEOUT,
      undefined,
    )
  })

  it('throws an error when the request is not successful', async () => {
    const mockFetchPromise = Promise.resolve({
      ok: false,
      json: () => ({ errorMessage: 'test error message' }),
    })
    mockFetch.mockReturnValue(mockFetchPromise)

    await expect(
      fetchUsdPrices(
        ['0x765DE816845861e75A25fCA122bb6898B8B1282a'],
        BlockscoutChain.Celo,
      ),
    ).rejects.toThrowError('Error fetching prices from coingecko')

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.coingecko.com/api/v3/simple/token_price/celo?contract_addresses=0x765DE816845861e75A25fCA122bb6898B8B1282a&vs_currencies=usd`,
      TIMEOUT,
      undefined,
    )
  })
})

describe('fetchPrices', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns prices in base token units', async () => {
    const mockResponse: Record<string, { usd: number }> = {
      '0x765DE816845861e75A25fCA122bb6898B8B1282a': { usd: 1.002 },
      '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787': { usd: 0.45 },
      '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73': { usd: 2.34 },
    }
    const mockAddresses = Object.keys(mockResponse)
    const mockFetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
    mockFetch.mockReturnValue(mockFetchPromise)

    const prices = await fetchPrices(
      mockAddresses,
      BlockscoutChain.Celo,
      baseToken,
    )

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.coingecko.com/api/v3/simple/token_price/celo?contract_addresses=0x765DE816845861e75A25fCA122bb6898B8B1282a,0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787,0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73&vs_currencies=usd`,
      TIMEOUT,
      undefined,
    )

    expect(prices).toMatchInlineSnapshot(`
    {
      "0x765DE816845861e75A25fCA122bb6898B8B1282a": "1",
      "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73": "2.33532934131736526946",
      "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787": "0.44910179640718562874",
    }
    `)
  })

  it('throws an error when the base token price is missing', async () => {
    const mockResponse: Record<string, { usd: number }> = {
      '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787': { usd: 0.45 },
    }
    const mockAddresses = [
      '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
    ]
    const mockFetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })
    mockFetch.mockReturnValue(mockFetchPromise)

    await expect(
      fetchPrices(mockAddresses, BlockscoutChain.Celo, baseToken),
    ).rejects.toThrowError('Missing base token price from coingecko')

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.coingecko.com/api/v3/simple/token_price/celo?contract_addresses=0x765DE816845861e75A25fCA122bb6898B8B1282a,0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787&vs_currencies=usd`,
      TIMEOUT,
      undefined,
    )
  })
})
