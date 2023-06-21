import { DataSource } from 'apollo-datasource'
import { Address, createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { WEB3_PROVIDER_URL } from './config'
import { UserTokenBalance } from './types'
import tokenInfoCache from './helpers/TokenInfoCache'
import { erc20Abi } from './abis/ERC20'

export class BlockchainDataSource<TContext = any> extends DataSource {
  private client = createPublicClient({
    chain: celo,
    transport: http(WEB3_PROVIDER_URL),
  })

  constructor() {
    super()
  }

  async fetchUserBalances(address: string): Promise<UserTokenBalance[]> {
    const tokensInfo = tokenInfoCache.getTokensInfo()
    const tokensAddresses = tokensInfo.map((tokenInfo) =>
      tokenInfo.address.toLowerCase(),
    )

    const results = await this.client.multicall({
      contracts: tokensAddresses.map(
        (tokenAddress) =>
          ({
            address: tokenAddress as Address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address as Address],
          } as const),
      ),
      allowFailure: false,
    })

    return results
      .map((result, index) => ({
        tokenAddress: tokensAddresses[index],
        balance: result.toString(),
        decimals: tokensInfo[index].decimals.toString(),
        symbol: tokensInfo[index].symbol,
      }))
      .filter((token) => token.balance !== '0')
  }
}
