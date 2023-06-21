import dotenv from 'dotenv'
import { logger } from './logger'

// Load environment variables from .env file
if (process.env.JEST_WORKER_ID) {
  dotenv.config({ path: './jest.env' })
} else {
  dotenv.config()
}

export function getFirebaseAdminCreds(admin: any) {
  if (DEPLOY_ENV === 'local') {
    try {
      const serviceAccount = require('../serviceAccountKey.json')
      return admin.credential.cert(serviceAccount)
    } catch (error) {
      logger.error({
        msg: 'Error: Could not initialize admin credentials. Is serviceAccountKey.json missing?',
        error,
      })
    }
  } else {
    try {
      return admin.credential.applicationDefault()
    } catch (error) {
      logger.error({
        msg: 'Error: Could not retrieve default app creds',
        error,
      })
    }
  }
}

export const DEPLOY_ENV = (process.env.DEPLOY_ENV as string).toLowerCase()
export const EXCHANGE_RATES_API = (
  process.env.EXCHANGE_RATES_API as string
).toLowerCase()
export const BLOCKSCOUT_API = (
  process.env.BLOCKSCOUT_API as string
).toLowerCase()
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID
export const FIREBASE_DB = `https://${FIREBASE_PROJECT_ID}.firebaseio.com`
export const FAUCET_ADDRESS = (
  process.env.FAUCET_ADDRESS as string
).toLowerCase()
export const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL

export const CELO_TOKEN_ADDRESS = (
  process.env.CELO_TOKEN_ADDRESS as string
).toLowerCase()
export const STAKED_CELO_TOKEN_ADDRESS = (
  process.env.STAKED_CELO_TOKEN_ADDRESS as string
).toLowerCase()
export const STAKED_CELO_MANAGER_ADDRESS = (
  process.env.STAKED_CELO_MANAGER_ADDRESS as string
).toLowerCase()

export const GET_NFT_API_URL = process.env.GET_NFT_API_URL

export const FETCH_BALANCES_VIA_BLOCKSCOUT =
  process.env.FETCH_BALANCES_VIA_BLOCKSCOUT === 'true'
