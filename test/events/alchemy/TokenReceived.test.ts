import { TokenReceived } from '../../../src/events/alchemy'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  mockErc20Transfer,
  mockNftReceivedTx,
  mockTokenReceivedTx,
  mockTokenSentTx,
  mockTokenSwapTx,
  mockTxReceipt,
} from '../../mock-data/alchemy'

describe('TokenReceived', () => {
  const tokenReceived = new TokenReceived({ userAddress: 'some-address' })

  describe('matches', () => {
    it('returns true for tx with single erc 20 transfers to', () => {
      expect(tokenReceived.matches(mockTokenReceivedTx)).toEqual(true)
    })

    it('returns false for tx with multiple erc 20 transfers to', () => {
      const tx = new AlchemyTransaction({
        transfersFrom: [],
        transfersTo: [mockErc20Transfer, mockErc20Transfer],
        txReceipt: mockTxReceipt,
      })
      expect(tokenReceived.matches(tx)).toEqual(false)
    })

    it('returns false for tx with zero erc 20 transfers to', () => {
      expect(tokenReceived.matches(mockTokenSentTx)).toEqual(false)
      expect(tokenReceived.matches(mockNftReceivedTx)).toEqual(false)
    })

    it('returns false for tx with both erc 20 transfers from and to', () => {
      expect(tokenReceived.matches(mockTokenSwapTx)).toEqual(false)
    })
  })
})
