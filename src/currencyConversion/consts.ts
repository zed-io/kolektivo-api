import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils'

export const CGLD = CURRENCIES[CURRENCY_ENUM.GOLD].code
export const CUSD = CURRENCIES[CURRENCY_ENUM.DOLLAR].code
export const CEUR = CURRENCIES[CURRENCY_ENUM.EURO].code
export const EUR = 'EUR'
export const USD = 'USD'
export const CELO = 'CELO'
export enum supportedStableTokens {
  CEUR,
  CUSD,
}
export enum supportedCurrencies {
  EUR,
  USD,
}
export enum supportedPairs {
  'cGLD/cUSD',
  'cUSD/cGLD',
  'cGLD/cEUR',
  'cEUR/cGLD',
}
export enum stablePairs {
  'cUSD/USD',
  'USD/cUSD',
  'EUR/cEUR',
  'cEUR/EUR',
}

export enum supportedOracleTokens {
  'cGLD' = 'CELO',
  'cUSD' = 'CELO-DOLLAR',
  'cEUR' = 'CELO-EURO',
}

export const getCurrency = (code: string) => {
  return code.substring(1).toLowerCase()
}

export const enumKeyForValue = (x: any, value: string) => {
  const index = Object.values(x).indexOf(value.toUpperCase() as unknown as any)
  return Object.keys(x)[index]
}

export const enumValueForKey = (x: any, key: string) => {
  return x[key as keyof typeof x].toLowerCase()
}