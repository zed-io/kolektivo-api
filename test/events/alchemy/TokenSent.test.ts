import { TokenSent } from '../../../src/events/alchemy'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  mockErc20TransferFrom,
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
        transfersFrom: [mockErc20TransferFrom, mockErc20TransferFrom],
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
            transfersFrom: [
              { ...mockErc20TransferFrom, ...partialTransferFrom },
            ],
            transfersTo: [],
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
        timestamp: 1686689604000,
        transactionHash:
          '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e',
        block: '15',
        amount: {
          value: 0.27673935886568457,
          tokenAddress: '0x178e141a0e3b34152f73ff610437a7bf9b83267a',
          timestamp: 1686689604000,
        },
        address: '0xe90d9a3e765a221bc1a697a1a3b0bb2e8e8c5e78',
        account: '0xe90d9a3e765a221bc1a697a1a3b0bb2e8e8c5e78',
        fees: [], // TODO add fees once wallet can handle fees paid in native currency https://linear.app/valora/issue/ACT-840/display-fees-correctly-when-paid-in-native-token
        metadata: {
          title: 'recipient-name',
          image: 'recipient-image-url',
        },
      })
      expect(knownAddressesCache.getDisplayInfoFor).toHaveBeenCalledWith(
        '0xe90d9a3e765a221bc1a697a1a3b0bb2e8e8c5e78',
      )
    })
  })
})
