import { NftReceived } from '../../../src/events/alchemy'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  mockNftReceivedTx,
  mockNftSentTx,
  mockNftTransferTo,
  mockNftTransferFrom,
  mockTxReceipt,
} from '../../mock-data/alchemy'
import { AlchemyChain, TokenTransactionTypeV2 } from '../../../src/types'
import { EventBuilder } from '../../../src/helpers/EventBuilder'

describe('NftReceived', () => {
  const nftReceived = new NftReceived({
    userAddress: 'some-address',
    chain: AlchemyChain.Ethereum,
  })

  describe('matches', () => {
    it('returns true for tx with single nft transfers to', () => {
      expect(nftReceived.matches(mockNftReceivedTx)).toEqual(true)
    })

    it('returns true for tx with multiple nft transfers to', () => {
      const tx = new AlchemyTransaction({
        transfersFrom: [mockNftTransferFrom],
        transfersTo: [mockNftTransferTo, mockNftTransferTo],
        txReceipt: mockTxReceipt,
      })
      expect(nftReceived.matches(tx)).toEqual(true)
    })

    it('returns false for tx with zero nft transfers to', () => {
      expect(nftReceived.matches(mockNftSentTx)).toEqual(false)
    })
  })
  describe('getEvent', () => {
    it('calls EventBuilder.alchemyNftTransferEvent with correct params', async () => {
      EventBuilder.alchemyNftTransferEvent = jest.fn()
      await nftReceived.getEvent(mockNftReceivedTx)
      expect(EventBuilder.alchemyNftTransferEvent).toHaveBeenCalledWith({
        nftTransfers: [mockNftTransferTo],
        chain: AlchemyChain.Ethereum,
        type: TokenTransactionTypeV2.NFT_RECEIVED,
        transactionHash:
          '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e',
        block: '15',
      })
    })
  })
})
