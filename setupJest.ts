import { enableFetchMocks } from 'jest-fetch-mock'

enableFetchMocks()

process.env.CELO_TOKEN_ADDRESS = '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9'
process.env.STAKED_CELO_TOKEN_ADDRESS =
  '0xD22E18556E43cb29D6d6172D4b33Fd2Edb629EF2'
process.env.STAKED_CELO_MANAGER_ADDRESS =
  '0xFfe124dde2b29fA848aD8caAEBE85651F0b5c406'
process.env.WEB3_PROVIDER_URL = 'https://alfajores-forno.celo-testnet.org'
