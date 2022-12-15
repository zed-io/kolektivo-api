import { getStakedCeloPriceInCelo } from '../../src/prices/StakedCelo'

// Tests againt alfajores
describe('StakedCelo', () => {
  it('calls the contract and returns a number', async () => {
    const result = await getStakedCeloPriceInCelo()
    expect(result.toNumber()).toBeGreaterThan(0)
  })
})
