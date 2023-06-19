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
import knownAddressesCache from '../../../src/helpers/KnownAddressesCache'

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

  describe('getEvent', () => {
    it.each([
      { value: null },
      {
        rawContract: {
          address: null,
          value: '0x123',
          decimal: '0x18',
        },
      },
    ])('throws when required field is missing', async (partialTransferFrom) => {
      await expect(() =>
        tokenSent.getEvent(
          new AlchemyTransaction({
            transfersFrom: [],
            transfersTo: [{ ...mockErc20Transfer, ...partialTransferFrom }],
            txReceipt: mockTxReceipt,
          }),
        ),
      ).rejects.toThrowError()
    })
    it('correctly maps AlchemyTransaction to TokenTransferV2', async () => {
      knownAddressesCache.getDisplayInfoFor = jest.fn().mockReturnValue({
        name: 'recipient-name',
        imageUrl: 'recipient-image-url',
      })
      expect(await tokenSent.getEvent(mockTokenSentTx)).toEqual({
        type: 'SENT',
        timestamp: 1670456975000,
        transactionHash: 'correct-hash',
        block: '0',
        amount: {
          value: 1.233468,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          timestamp: 1670456975000,
        },
        address: 'to-address',
        account: 'to-address',
        fees: [], // TODO add fees once wallet can handle fees paid in native currency https://linear.app/valora/issue/ACT-840/display-fees-correctly-when-paid-in-native-token
        metadata: {
          title: 'recipient-name',
          image: 'recipient-image-url',
        },
      })
      expect(knownAddressesCache.getDisplayInfoFor).toHaveBeenCalledWith(
        'to-address',
      )
    })
  })
})
