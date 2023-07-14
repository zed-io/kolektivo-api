import nock from 'nock'
import { EventBuilder } from '../src/helpers/EventBuilder'
import { GET_NFT_API_URL } from '../src/config'
import {
  AlchemyChain,
  BlockscoutChain,
  Nft,
  TokenTransactionTypeV2,
} from '../src/types'
import { mockNftTransferTo } from './mock-data/alchemy'

jest.mock('../src/config.ts', () => {
  return {
    ...(jest.requireActual('../src/config.ts') as any),
    GET_NFT_API_URL: 'https://example.com/getNft',
  }
})

const mockContractGetter = jest.fn()

jest.mock('../src/utils.ts', () => ({
  ...(jest.requireActual('../src/utils.ts') as any),
  getContractAddresses: () => mockContractGetter(),
}))

nock('https://example.com')
  .get(
    '/getNft?contractAddress=0x1ecd77075f7504ba849d47dce4cdc9695f1fe942&tokenId=4&network=celo',
  )
  .reply(200, {
    message: 'OK',
    result: {
      contractAddress: '0x1ecd77075f7504ba849d47dce4cdc9695f1fe942',
      tokenId: '4',
      ownerAddress: '0x0d35324061f620f66af983dee02076b2e45e57fc',
      transferBlockNumber: 9694887,
      tokenUri:
        'https://ipfs.io/ipfs/bafybeicsrikq5rsxaplbeq7baumulhbo5xpbkkpnftockfgb5pbvp55bcy/metadata/4.json',
      metadata: {
        dna: '010000100003024300020001',
        attributes: [
          { trait_type: 'Species', value: 'Citizen Ape' },
          { trait_type: 'Background', value: 'Stellar Sky' },
          { trait_type: 'Glasses', value: 'Modern Glasses' },
          { trait_type: 'Clothes', value: 'Dark Full Sleve' },
          { trait_type: 'Head', value: 'Pirate Hat' },
          { trait_type: 'Misc', value: 'CeloStarter Chain' },
          { trait_type: 'Mouth Props', value: 'Cigar' },
        ],
        edition: 4,
        name: 'CeloApesKingdom #4',
        date: 1645515318602,
        description:
          'Celo Apes are native Apes NFT on the Celo Blockchain. All the NFT holders will be part of the Ape Kingdom. Only 10000 Apes will be minted with new and unique traits!',
        image:
          'https://ipfs.io/ipfs/bafybeidxfrj72znilkjxwxdyo6kfqlumm3vihqzy4lbdd7wefvsfqh6es4/apes/4.png',
      },
      recognized: true,
      media: [
        {
          raw: 'https://ipfs.io/ipfs/bafybeidxfrj72znilkjxwxdyo6kfqlumm3vihqzy4lbdd7wefvsfqh6es4/apes/4.png',
          gateway: 'https://examlpe.com/gateway',
        },
      ],
    },
  })
  .persist()

nock('https://example.com')
  .get(
    '/getNft?contractAddress=0x1ecd77075f7504ba849d47dce4cdc9695f1fe942&tokenId=1&network=celo',
  )
  .reply(500, {
    message: 'Internal Server Error',
  })

describe('getNft', () => {
  it('should return all Nft details on successful response', async () => {
    mockContractGetter.mockResolvedValue(
      '0x0000000000000000000000000000000000007E57',
    )

    const nft = await EventBuilder.getNft({
      contractAddress: '0x1ecd77075f7504ba849d47dce4cdc9695f1fe942',
      tokenId: '4',
      chain: BlockscoutChain.Celo,
    })
    expect(nft).toEqual({
      contractAddress: '0x1ecd77075f7504ba849d47dce4cdc9695f1fe942',
      metadata: {
        attributes: [
          {
            trait_type: 'Species',
            value: 'Citizen Ape',
          },
          {
            trait_type: 'Background',
            value: 'Stellar Sky',
          },
          {
            trait_type: 'Glasses',
            value: 'Modern Glasses',
          },
          {
            trait_type: 'Clothes',
            value: 'Dark Full Sleve',
          },
          {
            trait_type: 'Head',
            value: 'Pirate Hat',
          },
          {
            trait_type: 'Misc',
            value: 'CeloStarter Chain',
          },
          {
            trait_type: 'Mouth Props',
            value: 'Cigar',
          },
        ],
        date: 1645515318602,
        description:
          'Celo Apes are native Apes NFT on the Celo Blockchain. All the NFT holders will be part of the Ape Kingdom. Only 10000 Apes will be minted with new and unique traits!',
        dna: '010000100003024300020001',
        edition: 4,
        image:
          'https://ipfs.io/ipfs/bafybeidxfrj72znilkjxwxdyo6kfqlumm3vihqzy4lbdd7wefvsfqh6es4/apes/4.png',
        name: 'CeloApesKingdom #4',
      },
      ownerAddress: '0x0d35324061f620f66af983dee02076b2e45e57fc',
      tokenId: '4',
      tokenUri:
        'https://ipfs.io/ipfs/bafybeicsrikq5rsxaplbeq7baumulhbo5xpbkkpnftockfgb5pbvp55bcy/metadata/4.json',
      media: [
        {
          raw: 'https://ipfs.io/ipfs/bafybeidxfrj72znilkjxwxdyo6kfqlumm3vihqzy4lbdd7wefvsfqh6es4/apes/4.png',
          gateway: 'https://examlpe.com/gateway',
        },
      ],
    })
  })

  it(`should throw on error from ${GET_NFT_API_URL}`, async () => {
    mockContractGetter.mockResolvedValue(
      '0x0000000000000000000000000000000000007E57',
    )

    await expect(
      EventBuilder.getNft({
        contractAddress: '0x1ecd77075f7504ba849d47dce4cdc9695f1fe942',
        tokenId: '1',
        chain: BlockscoutChain.Celo,
      }),
    ).rejects.toThrow(`Received response code 500 from ${GET_NFT_API_URL}`)
  })
})

describe('getNfts', () => {
  const mockGetNft = jest.fn()
  beforeEach(() => {
    EventBuilder.getNft = mockGetNft
  })
  it('return successes and filter out failures', async () => {
    mockGetNft.mockImplementation(async ({ contractAddress, tokenId }) => {
      if (tokenId === 'bad') {
        throw new Error('simulating getNft error')
      }
      return {
        tokenId,
        contractAddress,
        tokenUri: 'token-uri',
        ownerAddress: '0x123',
        metadata: {
          name: 'nft-name',
          description: 'nft-description',
          image: 'nft-image',
        },
        media: [],
      }
    })
    const nfts = await EventBuilder.getNfts(
      [
        { tokenAddress: '0xabc', tokenId: 'good' },
        { tokenAddress: '0xdef', tokenId: 'bad' },
      ],
      BlockscoutChain.Celo,
    )
    expect(mockGetNft).toHaveBeenCalledWith({
      contractAddress: '0xabc',
      tokenId: 'good',
      chain: BlockscoutChain.Celo,
    })
    expect(mockGetNft).toHaveBeenCalledWith({
      contractAddress: '0xdef',
      tokenId: 'bad',
      chain: BlockscoutChain.Celo,
    })
    expect(nfts).toEqual([
      {
        tokenId: 'good',
        contractAddress: '0xabc',
        tokenUri: 'token-uri',
        ownerAddress: '0x123',
        metadata: {
          name: 'nft-name',
          description: 'nft-description',
          image: 'nft-image',
        },
        media: [],
      },
    ])
  })
})

describe('hasTokenIdAndTokenAddress', () => {
  it('returns true for object with tokenId and tokenAddress', () => {
    expect(
      EventBuilder.hasTokenIdAndTokenAddress({
        tokenId: 'token-id',
        tokenAddress: 'token-address',
      }),
    ).toEqual(true)
  })
  it('returns false for object that lacks tokenId or tokenAddress', () => {
    expect(
      EventBuilder.hasTokenIdAndTokenAddress({
        tokenId: null,
        tokenAddress: 'token-address',
      }),
    ).toEqual(false)
    expect(
      EventBuilder.hasTokenIdAndTokenAddress({
        tokenId: 'token-id',
        tokenAddress: null,
      }),
    ).toEqual(false)
    expect(
      EventBuilder.hasTokenIdAndTokenAddress({
        tokenId: null,
        tokenAddress: null,
      }),
    ).toEqual(false)
  })
})

describe('alchemyNftTransferEvent', () => {
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
    const nftTransfer = await EventBuilder.alchemyNftTransferEvent({
      nftTransfers: [mockNftTransferTo],
      chain: AlchemyChain.Ethereum,
      type: TokenTransactionTypeV2.NFT_RECEIVED,
      transactionHash: 'mock-transaction-hash',
      block: '15',
    })
    expect(EventBuilder.getNfts).toHaveBeenCalledWith(
      [
        {
          tokenId: 'nft-received-token-id',
          tokenAddress: '0x178e141a0e3b34152f73ff610437a7bf9b83267a',
        },
      ],
      AlchemyChain.Ethereum,
    )
    expect(nftTransfer).toEqual({
      type: 'NFT_RECEIVED',
      transactionHash: 'mock-transaction-hash',
      timestamp: 1686689604000,
      block: '15',
      fees: [], // TODO add fees once wallet can handle fees paid in native currency https://linear.app/valora/issue/ACT-840/display-fees-correctly-when-paid-in-native-token
      nfts: [mockNft],
    })
  })
})
