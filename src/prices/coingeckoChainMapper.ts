import { Chain } from '../types'

// Use: https://api.coingecko.com/api/v3/asset_platforms to find the id for a chain in coingecko
export const chainToCoingeckoId: Record<Chain, string> = {
  [Chain.Celo]: 'celo',
  [Chain.Ethereum]: 'ethereum',
}
