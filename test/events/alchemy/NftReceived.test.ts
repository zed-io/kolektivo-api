import { NftReceived } from '../../../src/events/alchemy'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  mockNftReceivedTx,
  mockNftSentTx,
  mockNftTransfer,
  mockTxReceipt,
} from '../../mock-data/alchemy'

describe('NftReceived', () => {
  const nftReceived = new NftReceived({ userAddress: 'some-address' })

  describe('matches', () => {
    it('returns true for tx with single nft transfers to', () => {
      expect(nftReceived.matches(mockNftReceivedTx)).toEqual(true)
    })

    it('returns true for tx with multiple nft transfers to', () => {
      const tx = new AlchemyTransaction({
        transfersFrom: [mockNftTransfer],
        transfersTo: [mockNftTransfer, mockNftTransfer],
        txReceipt: mockTxReceipt,
      })
      expect(nftReceived.matches(tx)).toEqual(true)
    })

    it('returns false for tx with zero nft transfers to', () => {
      expect(nftReceived.matches(mockNftSentTx)).toEqual(false)
    })
  })
})
