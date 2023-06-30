import { NftSent } from '../../../src/events/alchemy'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  mockNftReceivedTx,
  mockNftSentTx,
  mockNftTransferFrom,
  mockNftTransferTo,
  mockTxReceipt,
} from '../../mock-data/alchemy'
import { AlchemyChain } from '../../../src/types'

describe('NftSent', () => {
  const nftSent = new NftSent({
    userAddress: 'some-address',
    chain: AlchemyChain.Ethereum,
  })

  describe('matches', () => {
    it('returns true for tx with single nft transfers from', () => {
      expect(nftSent.matches(mockNftSentTx)).toEqual(true)
    })

    it('returns true for tx with multiple nft transfers to', () => {
      const tx = new AlchemyTransaction({
        transfersFrom: [mockNftTransferFrom, mockNftTransferFrom],
        transfersTo: [mockNftTransferTo],
        txReceipt: mockTxReceipt,
      })
      expect(nftSent.matches(tx)).toEqual(true)
    })

    it('returns false for tx with zero nft transfers to', () => {
      expect(nftSent.matches(mockNftReceivedTx)).toEqual(false)
    })
  })
})
