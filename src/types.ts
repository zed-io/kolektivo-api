import BigNumber from 'bignumber.js'
import { BlockscoutTransaction } from './transaction/blockscout/BlockscoutTransaction'
import { AlchemyTransaction } from './transaction/alchemy/AlchemyTransaction'

// Event types
export enum TokenTransactionTypeV2 {
  EXCHANGE = 'EXCHANGE',
  RECEIVED = 'RECEIVED',
  SENT = 'SENT',
  INVITE_SENT = 'INVITE_SENT',
  INVITE_RECEIVED = 'INVITE_RECEIVED',
  PAY_REQUEST = 'PAY_REQUEST',
  NFT_SENT = 'NFT_SENT',
  NFT_RECEIVED = 'NFT_RECEIVED',
  SWAP_TRANSACTION = 'SWAP_TRANSACTION',
}

export enum LegacyEventTypes {
  EXCHANGE = 'EXCHANGE',
  RECEIVED = 'RECEIVED',
  SENT = 'SENT',
  FAUCET = 'FAUCET',
  VERIFICATION_FEE = 'VERIFICATION_FEE',
  ESCROW_SENT = 'ESCROW_SENT',
  ESCROW_RECEIVED = 'ESCROW_RECEIVED',
  CONTRACT_CALL = 'CONTRACT_CALL',
}

export enum EventTypes {
  EXCHANGE = 'EXCHANGE',
  RECEIVED = 'RECEIVED',
  SENT = 'SENT',
  FAUCET = 'FAUCET',
  VERIFICATION_FEE = 'VERIFICATION_FEE',
  ESCROW_SENT = 'ESCROW_SENT',
  ESCROW_RECEIVED = 'ESCROW_RECEIVED',
  CONTRACT_CALL = 'CONTRACT_CALL',
}

export interface PageInfo {
  hasPreviousPage: boolean
  hasNextPage: boolean
  startCursor?: string
  endCursor?: string
}

export interface TokenTransactionResult {
  transactions: TokenTransactionV2[]
  pageInfo: PageInfo
}

export interface TokenTransferV2 extends TokenTransactionV2 {
  type: TokenTransactionTypeV2
  timestamp: number
  block: string
  amount: TokenAmount
  address: string
  account: string
  transactionHash: string
  fees: FeeV2[]
  metadata: TokenTransferMetadata
}

export interface NftTransferV2 extends TokenTransactionV2 {
  type: TokenTransactionTypeV2
  transactionHash: string
  timestamp: number
  block: string
  fees?: FeeV2[]
  nfts?: Nft[]
}

export interface TokenExchangeV2 extends TokenTransactionV2 {
  type: TokenTransactionTypeV2
  timestamp: number
  block: string
  inAmount: TokenAmount
  outAmount: TokenAmount
  transactionHash: string
  fees: FeeV2[]
  metadata?: TokenExchangeMetadata
}

export interface Nft {
  tokenId: string
  contractAddress: string
  tokenUri: string | null
  ownerAddress: string | null
  metadata: {
    name: string
    description: string
    image: string
    dna?: string
    id?: number
    date?: number
    attributes?: [
      {
        trait_type: string
        value: string
      },
    ]
  } | null
  media:
    | [
        {
          raw: string
          gateway: string
        },
      ]
    | []
}

export interface TokenExchangeMetadata {
  title: string
  subtitle: string
}

export interface TokenTransferMetadata {
  title?: string
  subtitle?: string
  image?: string
  comment?: string
}

export interface TokenTransactionV2 {
  type: TokenTransactionTypeV2
  timestamp: number
  block: string
  transactionHash: string
  fees?: FeeV2[]
}

export interface TokenAmount {
  value: BigNumber.Value
  tokenAddress: string
  timestamp: number
}

export interface FeeV2 {
  type: FeeType
  amount: TokenAmount
}

export interface BlockscoutCeloTransfer {
  fromAddressHash: string
  toAddressHash: string
  fromAccountHash: string
  toAccountHash: string
  token: string
  value: string
}

export interface BlockscoutTokenTransfer {
  fromAddressHash: string
  toAddressHash: string
  fromAccountHash: string
  toAccountHash: string
  token: string
  tokenAddress: string
  value: string
  tokenType: string
  tokenId: string
}

export interface BlockscoutTransferTx {
  blockNumber: number
  transactionHash: string
  timestamp: string
  gasPrice: string
  gasUsed: string
  feeToken: string
  gatewayFee: string
  gatewayFeeRecipient: string
  input: string
  celoTransfers: BlockscoutCeloTransfer[]
}

export enum FeeType {
  SECURITY_FEE = 'SECURITY_FEE',
  GATEWAY_FEE = 'GATEWAY_FEE',
  ONE_TIME_ENCRYPTION_FEE = 'ONE_TIME_ENCRYPTION_FEE',
  INVITATION_FEE = 'INVITATION_FEE',
}

export interface MoneyAmount {
  value: BigNumber.Value
  currencyCode: string
  // Implied exchange rate (based on exact amount exchanged) which overwrites
  // the estimate in firebase (based on a constant exchange amount)
  impliedExchangeRates?: { [key: string]: BigNumber.Value }
  timestamp: number
}

export interface Fee {
  type: FeeType
  amount: MoneyAmount
}

export interface LegacyExchangeEvent {
  type: LegacyEventTypes
  timestamp: number
  block: number
  outValue: number
  outSymbol: string
  inValue: number
  inSymbol: string
  hash: string
  fees: Fee[]
}

export interface LegacyTransferEvent {
  type: LegacyEventTypes
  timestamp: number
  block: number
  value: number
  address: string
  account: string
  comment: string
  symbol: string
  hash: string
  fees: Fee[]
}

export type Token = 'cUSD' | 'cGLD' | 'cEUR'

export interface TokenTransactionV2Args {
  // Address to fetch transactions from.
  address: string
  // This field is being ignored for now but will be used in future PRs
  // TODO: Filter all the transactions in given tokens. If not present, no filtering is done.
  tokens?: [string]
  // If present, every TokenAmount will contain the field localAmount with the estimated amount in given currency.
  localCurrencyCode?: string
  // If present, this parameter is used as the 'after' parameter for blockscout calls.
  afterCursor?: string
  // If present, will fetch transactions from the specified chain, else will default to Celo
  chain?: Chain
}

export interface TokenTransactionArgs {
  address: string
  token: Token | null
  tokens?: Token[]
  localCurrencyCode: string
}

export interface UserTokenBalance {
  tokenAddress: string
  balance: string
  decimals: string
  symbol: string
}

export interface UserTokenBalances {
  balances: UserTokenBalance[]
}

export interface CurrencyConversionArgs {
  sourceCurrencyCode?: string
  currencyCode: string
  timestamp?: number
  impliedExchangeRates?: MoneyAmount['impliedExchangeRates']
}

export interface LocalMoneyAmount {
  value: BigNumber.Value
  currencyCode: string
  exchangeRate: string
}

export type LegacyEventInterface = LegacyExchangeEvent | LegacyTransferEvent

export enum Chain {
  Celo = 'Celo',
  Ethereum = 'Ethereum',
}

// A type containing all transaction provider-specific Transaction representations
export type Transaction = BlockscoutTransaction | AlchemyTransaction
