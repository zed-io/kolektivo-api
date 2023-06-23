import BigNumber from 'bignumber.js'
import { logger } from '../logger'
import { Chain } from '../types'
import { chainToCoingeckoId } from './coingeckoChainMapper'
import { fetchWithTimeout } from '../helpers/fetchWithTimeout'

export const TIMEOUT = 30000
export const BASE_URL = 'https://api.coingecko.com/api/v3/simple/token_price'

const USD = 'usd'

export async function fetchUsdPrices(tokenAddresses: string[], chain: Chain) {
  const chainId = chainToCoingeckoId[chain]

  const url = `${BASE_URL}/${chainId}?contract_addresses=${tokenAddresses.join(
    ',',
  )}&vs_currencies=${USD}`

  logger.debug(`Fetching usd prices with ${url}`)
  const response = await fetchWithTimeout(url, TIMEOUT)
  const jsonResponse = await response.json()

  if (!response.ok) {
    logger.error(
      { response, jsonResponse },
      `Error fetching prices from coingecko`,
    )
    throw new Error(
      `Error fetching prices from coingecko: ${response.status} ${response.statusText}`,
    )
  }

  const prices: Record<string, BigNumber> = {}
  for (const tokenAddress of tokenAddresses) {
    if (jsonResponse[tokenAddress] && jsonResponse[tokenAddress][USD]) {
      const usdPrice = jsonResponse[tokenAddress][USD]
      prices[tokenAddress] = new BigNumber(usdPrice)
    }
  }

  return prices
}

/**
 * Returns token prices in base token units.
 */
export async function fetchPrices(
  tokenAddresses: string[],
  chain: Chain,
  baseTokenAddress: string,
) {
  const usdPrices = await fetchUsdPrices(tokenAddresses, chain)

  const baseTokenUsdPrice = usdPrices[baseTokenAddress]
  if (!baseTokenUsdPrice) {
    logger.error(
      { usdPrices, baseTokenAddress },
      'Missing base token price from coingecko',
    )
    throw new Error('Missing base token price from coingecko')
  }

  const prices: Record<string, BigNumber> = {}
  for (const tokenAddress of Object.keys(usdPrices)) {
    prices[tokenAddress] = usdPrices[tokenAddress].dividedBy(baseTokenUsdPrice)
  }

  return prices
}

export async function fetchPricesOrEmpty(
  tokenAddresses: string[],
  chain: Chain,
  baseTokenAddress: string,
) {
  try {
    return await fetchPrices(tokenAddresses, chain, baseTokenAddress)
  } catch (err) {
    logger.error({
      err,
      type: 'ERROR_FETCHING_PRICES_FROM_COINGECKO',
    })
    return {}
  }
}
