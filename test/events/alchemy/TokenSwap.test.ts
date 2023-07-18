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

  describe('getEvent', () => {
    it.each([
      {
        from: { value: null },
        to: {
          value: 0.5,
          rawContract: { address: '0xab', value: '0x123', decimal: '0x18' },
        },
      },
      {
        from: {
          value: 0.5,
          rawContract: { address: '0xab', value: '0x123', decimal: '0x18' },
        },
        to: { value: null },
      },
      {
        from: {
          value: 0.5,
          rawContract: { address: null, value: '0x123', decimal: '0x18' },
        },
        to: {
          value: 0.5,
          rawContract: { address: '0xab', value: '0x123', decimal: '0x18' },
        },
      },
      {
        from: {
          value: 0.5,
          rawContract: { address: '0xab', value: '0x123', decimal: '0x18' },
        },
        to: {
          value: 0.5,
          rawContract: { address: null, value: '0x123', decimal: '0x18' },
        },
      },
    ])(
      'throws when required field is missing',
      async ({ from: partialFrom, to: partialTo }) => {
        await expect(() =>
          tokenSwap.getEvent(
            new AlchemyTransaction({
              transfersFrom: [{ ...mockErc20TransferFrom, ...partialFrom }],
              transfersTo: [{ ...mockErc20TransferTo, ...partialTo }],
              txReceipt: mockTxReceipt,
            }),
          ),
        ).rejects.toThrowError()
      },
    )
    it('correctly maps AlchemyTransaction to TokenExchangeV2', async () => {
      expect(await tokenSwap.getEvent(mockTokenSwapTx)).toEqual({
        type: 'SWAP_TRANSACTION',
        timestamp: 1686689604000,
        transactionHash:
          '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e',
        block: '15',
        inAmount: {
          value: 0.5,
          tokenAddress: '0x178e141a0e3b34152f73ff610437a7bf9b83267b',
          timestamp: 1686689604000,
        },
        outAmount: {
          value: 0.4,
          tokenAddress: '0x178e141a0e3b34152f73ff610437a7bf9b83267a',
          timestamp: 1686689604000,
        },
        fees: [],
      })
    })
  })
})
