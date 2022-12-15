import { getContractKit, WEI_PER_GOLD } from '../utils'
import stakedCeloManager from '../abis/stakedCelo/Manager.json'
import BigNumber from 'bignumber.js'
import { STAKED_CELO_MANAGER_ADDRESS } from '../config'
import { AbiItem } from '@celo/connect'

const stakedCeloManagerAbi = stakedCeloManager as AbiItem[]

export async function getStakedCeloPriceInCelo(): Promise<BigNumber> {
  const kit = await getContractKit()
  const contract = new kit.web3.eth.Contract(
    stakedCeloManagerAbi,
    STAKED_CELO_MANAGER_ADDRESS,
  )
  const stakedCeloAmount = new BigNumber(WEI_PER_GOLD)
  const celoAmount = await contract.methods.toCelo(stakedCeloAmount).call()
  if (!celoAmount) {
    throw new Error('Error calling staked celo contract')
  }

  const stakedCeloPrice = new BigNumber(celoAmount).div(stakedCeloAmount)
  return stakedCeloPrice
}
