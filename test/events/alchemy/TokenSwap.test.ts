import { TokenSwap } from '../../../src/events/alchemy'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  mockErc20TransferFrom,
  mockErc20TransferTo,
  mockNftSentTx,
  mockTokenReceivedTx,
  mockTokenSentTx,
  mockTokenSwapTx,
  mockTxReceipt,
} from '../../mock-data/alchemy'
import { AlchemyChain } from '../../../src/types'

describe('TokenSwap', () => {
  const tokenSwap = new TokenSwap({
    userAddress: 'some-address',
    chain: AlchemyChain.Ethereum,
  })

  describe('matches', () => {
    it('returns true for tx with exactly one erc 20 transfers from and to', () => {
      expect(tokenSwap.matches(mockTokenSwapTx)).toEqual(true)
    })

    it('returns false for tx with multiple erc 20 transfers from and to', () => {
      const tx = new AlchemyTransaction({
        transfersFrom: [mockErc20TransferFrom, mockErc20TransferFrom],
        transfersTo: [mockErc20TransferTo, mockErc20TransferTo],
        txReceipt: mockTxReceipt,
      })
      expect(tokenSwap.matches(tx)).toEqual(false)
    })

    it('returns false for tx with zero erc 20 transfers', () => {
      expect(tokenSwap.matches(mockNftSentTx)).toEqual(false)
    })

    it('returns false for tx with only erc 20 transfers from or to', () => {
      expect(tokenSwap.matches(mockTokenSentTx)).toEqual(false)
      expect(tokenSwap.matches(mockTokenReceivedTx)).toEqual(false)
    })
  })
})
