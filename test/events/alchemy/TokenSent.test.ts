import { TokenSent } from '../../../src/events/alchemy'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  mockErc20Transfer,
  mockNftSentTx,
  mockTokenReceivedTx,
  mockTokenSentTx,
  mockTokenSwapTx,
  mockTxReceipt,
} from '../../mock-data/alchemy'

describe('TokenSent', () => {
  const tokenSent = new TokenSent({ userAddress: 'some-address' })

  describe('matches', () => {
    it('returns true for tx with single erc 20 transfers from', () => {
      expect(tokenSent.matches(mockTokenSentTx)).toEqual(true)
    })

    it('returns false for tx with multiple erc 20 transfers from', () => {
      const tx = new AlchemyTransaction({
        transfersFrom: [mockErc20Transfer, mockErc20Transfer],
        transfersTo: [],
        txReceipt: mockTxReceipt,
      })
      expect(tokenSent.matches(tx)).toEqual(false)
    })

    it('returns false for tx with zero erc 20 transfers from', () => {
      expect(tokenSent.matches(mockTokenReceivedTx)).toEqual(false)
      expect(tokenSent.matches(mockNftSentTx)).toEqual(false)
    })

    it('returns false for tx with both erc 20 transfers from and to', () => {
      expect(tokenSent.matches(mockTokenSwapTx)).toEqual(false)
    })
  })
})
