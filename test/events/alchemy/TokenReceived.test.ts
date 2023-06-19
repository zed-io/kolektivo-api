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
import knownAddressesCache from '../../../src/helpers/KnownAddressesCache'

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
      { to: null },
    ])('throws when required field is missing', async (partialTransferTo) => {
      await expect(() =>
        tokenReceived.getEvent(
          new AlchemyTransaction({
            transfersFrom: [],
            transfersTo: [{ ...mockErc20Transfer, ...partialTransferTo }],
            txReceipt: mockTxReceipt,
          }),
        ),
      ).rejects.toThrowError()
    })
    it('correctly maps AlchemyTransaction to TokenTransferV2', async () => {
      knownAddressesCache.getDisplayInfoFor = jest.fn().mockReturnValue({
        name: 'sender-name',
        imageUrl: 'sender-image-url',
      })
      expect(await tokenReceived.getEvent(mockTokenReceivedTx)).toEqual({
        type: 'RECEIVED',
        timestamp: 1670456975000,
        transactionHash: 'correct-hash',
        block: '0',
        amount: {
          value: 1.233468,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          timestamp: 1670456975000,
        },
        address: 'from-address',
        account: 'from-address',
        fees: [],
        metadata: {
          title: 'sender-name',
          image: 'sender-image-url',
        },
      })
    })
  })
})
