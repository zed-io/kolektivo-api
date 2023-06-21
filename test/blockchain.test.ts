import { BlockchainDataSource } from '../src/blockchain'

jest.mock('../src/helpers/TokenInfoCache', () => ({
  getTokensInfo: () => [
    {
      address: '0x048f47d358ec521a6cf384461d674750a3cb58c8',
      decimals: 10,
      name: 'Test Token',
      symbol: 'TT',
      type: 'ERC-20',
    },
    {
      address: '0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f',
      decimals: 18,
      name: 'Celo Euro',
      symbol: 'cEUR',
      type: 'ERC-20',
    },
    {
      address: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
      decimals: 18,
      name: 'Celo Dollar',
      symbol: 'cUSD',
      type: 'ERC-20',
    },
    {
      address: '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
      decimals: 18,
      name: 'Celo native asset',
      symbol: 'CELO',
      type: 'ERC-20',
    },
  ],
}))

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  createPublicClient: () => ({
    multicall: (...args: any) => mockMulticall(...args),
  }),
}))

const mockMulticall = jest.fn()

describe('BlockchainDataSource', () => {
  let blockchainDataSource: BlockchainDataSource

  beforeEach(() => {
    jest.clearAllMocks()
    blockchainDataSource = new BlockchainDataSource()
  })

  it('should return the right fields for each token balance', async () => {
    mockMulticall.mockResolvedValue([
      2871713969586n,
      2947248590163445104n,
      0n, // will be filtered out
      4646922697027429935n,
    ])

    const result = await blockchainDataSource.fetchUserBalances(
      '0x0000000000000000000000000000000000007E57',
    )

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "balance": "2871713969586",
          "decimals": "10",
          "symbol": "TT",
          "tokenAddress": "0x048f47d358ec521a6cf384461d674750a3cb58c8",
        },
        {
          "balance": "2947248590163445104",
          "decimals": "18",
          "symbol": "cEUR",
          "tokenAddress": "0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f",
        },
        {
          "balance": "4646922697027429935",
          "decimals": "18",
          "symbol": "CELO",
          "tokenAddress": "0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9",
        },
      ]
    `)
  })
})
