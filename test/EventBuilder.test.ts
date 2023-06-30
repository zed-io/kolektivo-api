import nock from 'nock'
import { EventBuilder } from '../src/helpers/EventBuilder'
import { GET_NFT_API_URL } from '../src/config'
import { Chain } from '../src/types'

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
      chain: Chain.Celo,
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
        chain: Chain.Celo,
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
      Chain.Celo,
    )
    expect(mockGetNft).toHaveBeenCalledWith({
      contractAddress: '0xabc',
      tokenId: 'good',
      chain: Chain.Celo,
    })
    expect(mockGetNft).toHaveBeenCalledWith({
      contractAddress: '0xdef',
      tokenId: 'bad',
      chain: Chain.Celo,
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
