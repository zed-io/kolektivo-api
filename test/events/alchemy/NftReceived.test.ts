import {
  hasTokenIdAndTokenAddress,
  NftReceived,
} from '../../../src/events/alchemy'
import { AlchemyTransaction } from '../../../src/transaction/alchemy/AlchemyTransaction'
import {
  mockNftReceivedTx,
  mockNftSentTx,
  mockNftTransferTo,
  mockNftTransferFrom,
  mockTxReceipt,
} from '../../mock-data/alchemy'
import { EventBuilder } from '../../../src/helpers/EventBuilder'
import { Chain, Nft } from '../../../src/types'

describe('NftReceived', () => {
  const nftReceived = new NftReceived({
    userAddress: 'some-address',
    chain: Chain.Ethereum,
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
    it('maps alchemy transaction to NftTransferV2', async () => {
      const mockNft: Nft = {
        tokenId: 'nft-received-token-id',
        contractAddress: '0x178e141a0e3b34152f73ff610437a7bf9b83267a',
        tokenUri: 'token-uri',
        ownerAddress: '0x123',
        metadata: {
          name: 'nft-name',
          description: 'nft-description',
          image: 'nft-image',
        },
        media: [],
      }
      EventBuilder.getNfts = jest.fn().mockResolvedValue([mockNft])
      const nftTransfer = await nftReceived.getEvent(
        new AlchemyTransaction({
          transfersTo: [mockNftTransferTo],
          transfersFrom: [],
          txReceipt: mockTxReceipt,
        }),
      )
      expect(EventBuilder.getNfts).toHaveBeenCalledWith(
        [
          {
            tokenId: 'nft-received-token-id',
            tokenAddress: '0x178e141a0e3b34152f73ff610437a7bf9b83267a',
          },
        ],
        Chain.Ethereum,
      )
      expect(nftTransfer).toEqual({
        type: 'NFT_RECEIVED',
        transactionHash:
          '0xf50609b7ea2122ed93c182a8339f9dd9b952c101e83c516a478db39f80c73c3e',
        timestamp: 1686689604000,
        block: '15',
        fees: [], // TODO add fees once wallet can handle fees paid in native currency https://linear.app/valora/issue/ACT-840/display-fees-correctly-when-paid-in-native-token
        nfts: [mockNft],
      })
    })
  })

  describe('hasTokenIdAndTokenAddress', () => {
    it('returns true for object with tokenId and tokenAddress', () => {
      expect(
        hasTokenIdAndTokenAddress({
          tokenId: 'token-id',
          tokenAddress: 'token-address',
        }),
      ).toEqual(true)
    })
    it('returns false for object that lacks tokenId or tokenAddress', () => {
      expect(
        hasTokenIdAndTokenAddress({
          tokenId: null,
          tokenAddress: 'token-address',
        }),
      ).toEqual(false)
      expect(
        hasTokenIdAndTokenAddress({ tokenId: 'token-id', tokenAddress: null }),
      ).toEqual(false)
      expect(
        hasTokenIdAndTokenAddress({ tokenId: null, tokenAddress: null }),
      ).toEqual(false)
    })
  })
})
