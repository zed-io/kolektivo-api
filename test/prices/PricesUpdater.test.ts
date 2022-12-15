import {
  ONE_DAY_IN_MS,
  storeHistoricalPrices,
  updateCurrentPrices,
  updateHistoricalPrices,
} from '../../src/prices/PricesUpdater'
import { initDatabase } from '../../src/database/db'
import { Knex } from 'knex'
import { ExchangeRateManager } from '@valora/exchanges'
import BigNumber from 'bignumber.js'
import PricesService from '../../src/prices/PricesService'
import { CELO_TOKEN_ADDRESS, STAKED_CELO_TOKEN_ADDRESS } from '../../src/config'

const STAKED_CELO = {
  address: STAKED_CELO_TOKEN_ADDRESS,
}

const CELO = {
  address: CELO_TOKEN_ADDRESS,
}

const cUSD = {
  address: '0x1234',
}
const cEUR = {
  address: '0x1235',
}
const bitcoin = {
  address: '0x1236',
}
const mcEUR = {
  address: '0x1237',
  pegTo: '0x1235',
}
const extraToken = {
  address: '0x1111',
}
const extraPegToken = {
  address: '0x1112',
  pegTo: '0x12222',
}

const OLD_ENV = process.env

const FIREBASE_NODE = '/tokensInfo'

const TABLE_NAME = 'historical_token_prices'

const mockUpdateFirebase = jest.fn()

jest.mock('../../src/firebase', () => ({
  updateFirebase: (path: string, object: any) =>
    mockUpdateFirebase(path, object),
}))

jest.mock('../../src/helpers/TokenInfoCache', () => ({
  getTokensInfo: () => [
    CELO,
    cUSD,
    cEUR,
    mcEUR,
    extraToken,
    extraPegToken,
    STAKED_CELO,
  ],
  getTokensAddresses: () => [
    CELO.address,
    cUSD.address,
    cEUR.address,
    mcEUR.address,
    extraToken.address,
    extraPegToken.address,
    STAKED_CELO.address,
  ],
}))

jest.mock('../../src/prices/StakedCelo', () => ({
  getStakedCeloPriceInCelo: async () => new BigNumber(2),
}))

describe('Mocking date and exchange manager', () => {
  let dateNowSpy: any
  const mockDate = 1487076708000

  const mockCalculatePrices = jest.fn()
  const mockExchangeRateManager: ExchangeRateManager = {
    calculatecUSDPrices: mockCalculatePrices,
    cUSDTokenAddress: cUSD.address,
  }

  beforeAll(async () => {
    jest.clearAllMocks()
    mockCalculatePrices.mockReturnValue({
      [CELO.address]: new BigNumber(0.4),
      [cUSD.address]: new BigNumber(1),
      [cEUR.address]: new BigNumber(1.17),
      [bitcoin.address]: new BigNumber(60000),
    })

    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockDate)
    process.env.EXCHANGES_ENV = 'test'
  })

  afterAll(async () => {
    dateNowSpy.mockRestore()
    process.env = OLD_ENV
  })

  describe('PricesUpdater#updateCurrentPrices', () => {
    it('should update current prices for tokens in tokensInfo', async () => {
      await updateCurrentPrices({
        exchangeRateManager: mockExchangeRateManager,
      })
      expect(mockUpdateFirebase).toHaveBeenCalledWith(FIREBASE_NODE, {
        [`${CELO.address}/usdPrice`]: '0.4',
        [`${CELO.address}/priceFetchedAt`]: mockDate,
        [`${cUSD.address}/usdPrice`]: '1',
        [`${cUSD.address}/priceFetchedAt`]: mockDate,
        [`${cEUR.address}/usdPrice`]: '1.17',
        [`${cEUR.address}/priceFetchedAt`]: mockDate,
        // It's peg to the value of cEUR
        [`${mcEUR.address}/usdPrice`]: '1.17',
        [`${mcEUR.address}/priceFetchedAt`]: mockDate,
        [`${STAKED_CELO.address}/usdPrice`]: '0.8',
        [`${STAKED_CELO.address}/priceFetchedAt`]: mockDate,
      })
    })
  })

  describe('PricesUpdater#storeHistoricalPrices', () => {
    let db: Knex

    beforeEach(async () => {
      db = await initDatabase({ client: 'sqlite3' })
    })

    afterEach(async () => {
      await db.destroy()
    })

    it('should store token prices', async () => {
      expect(await db(TABLE_NAME)).toHaveLength(0)
      await storeHistoricalPrices({
        db,
        exchangeRateManager: mockExchangeRateManager,
      })

      expect(await db(TABLE_NAME)).toHaveLength(5)

      await expectPriceToBeStored(db, bitcoin.address, '60000', mockDate)
      await expectPriceToBeStored(db, cEUR.address, '1.17', mockDate)
      await expectPriceToBeStored(db, mcEUR.address, '1.17', mockDate)
      await expectPriceToBeStored(db, CELO.address, '0.4', mockDate)
      await expectPriceToBeStored(db, STAKED_CELO.address, '0.8', mockDate) // It's 2 times the price of CELO
    })
  })

  describe('PricesUpdater#updateLastDayPrices', () => {
    let dateNowSpy: any
    const mockDate = 1487076708000
    const expectedDateTime = mockDate - 1 * ONE_DAY_IN_MS
    const expectedDate = new Date(expectedDateTime)

    beforeAll(async () => {
      jest.clearAllMocks()
      dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockDate)
    })

    afterAll(async () => {
      dateNowSpy.mockRestore()
    })

    const mockGetTokenTocUSDPrice = jest.fn()
    // @ts-ignore: only this method is needed to test this feature.
    const pricesService: PricesService = {
      getTokenTocUSDPrice: async (tokenAddress: string, date: Date) =>
        mockGetTokenTocUSDPrice(tokenAddress, date),
    }

    it('should update last day prices', async () => {
      mockGetTokenTocUSDPrice.mockImplementation(
        (tokenAddress: string, date: Date) => {
          switch (tokenAddress) {
            case cUSD.address:
              return new BigNumber(1)
            case cEUR.address:
              return new BigNumber(1.17)
            default:
              throw new Error('Could find token prices')
          }
        },
      )

      await updateHistoricalPrices({ pricesService })
      expect(mockGetTokenTocUSDPrice).toHaveBeenCalledWith(
        cUSD.address,
        expectedDate,
      )
      expect(mockUpdateFirebase).toHaveBeenCalledWith(
        `${FIREBASE_NODE}/${cUSD.address}/historicalUsdPrices/lastDay`,
        {
          price: '1',
          at: expectedDateTime,
        },
      )
      expect(mockGetTokenTocUSDPrice).toHaveBeenCalledWith(
        cEUR.address,
        expectedDate,
      )
      expect(mockUpdateFirebase).toHaveBeenCalledWith(
        `${FIREBASE_NODE}/${cEUR.address}/historicalUsdPrices/lastDay`,
        {
          price: '1.17',
          at: expectedDateTime,
        },
      )
      expect(mockGetTokenTocUSDPrice).toHaveBeenCalledWith(
        extraToken.address,
        expectedDate,
      )
      expect(mockUpdateFirebase).not.toHaveBeenCalledWith(
        `${FIREBASE_NODE}/${extraToken.address}/historicalUsdPrices/lastDay`,
        expect.anything(),
      )
    })
  })
})

async function expectPriceToBeStored(
  db: Knex,
  address: string,
  price: string,
  mockDate: number,
) {
  const query = await db(TABLE_NAME).where({ token: address })
  expect(query).toHaveLength(1)
  expect(query[0]).toMatchObject({
    base_token: cUSD.address,
    token: address,
    price,
    at: new Date(mockDate).toISOString(),
  })
}
