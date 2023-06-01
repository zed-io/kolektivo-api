import { AlchemyDataSource } from '../../../src/datasource/alchemy/AlchemyDataSource'
import { Chain } from '../../../src/types'

describe('AlchemyDataSource', () => {
  describe('constructor', () => {
    it('accepts Ethereum chain', () => {
      expect(() => new AlchemyDataSource(Chain.Ethereum)).not.toThrow()
    })
    it('throws on unsupported chain', () => {
      expect(() => new AlchemyDataSource(Chain.Celo)).toThrow()
    })
  })
})
