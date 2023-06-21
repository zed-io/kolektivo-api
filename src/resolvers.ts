import BigNumber from 'bignumber.js'
import { DataSources } from './apolloServer'
import { USD } from './currencyConversion/consts'
import { logger } from './logger'
import {
  TokenTransactionV2Args,
  TokenTransactionArgs,
  CurrencyConversionArgs,
  UserTokenBalances,
  LegacyEventInterface,
  LegacyEventTypes,
  TokenTransactionV2,
  TokenTransactionTypeV2,
  TokenAmount,
  MoneyAmount,
  TokenTransactionResult,
  Chain,
} from './types'
import { FETCH_BALANCES_VIA_BLOCKSCOUT } from './config'

export interface Context {
  valoraVersion: string | undefined
  dataSources: DataSources
  localCurrencyCode?: string
}

export const resolvers = {
  Query: {
    tokenTransactionsV2: async (
      _source: any,
      args: TokenTransactionV2Args,
      context: Context,
    ): Promise<TokenTransactionResult> => {
      const { dataSources, valoraVersion } = context
      context.localCurrencyCode = args.localCurrencyCode
      const chain = args.chain ?? Chain.Celo
      try {
        switch (chain) {
          case Chain.Celo: {
            return await dataSources.blockscoutAPI.getTokenTransactionsV2(
              args.address,
              args.afterCursor,
              valoraVersion,
            )
          }
          case Chain.Ethereum: {
            return await dataSources.ethereumDataSource.getTokenTxs(
              args.address,
              args.afterCursor,
              valoraVersion,
            )
          }
          default: {
            throw new Error(`Unknown chain parameter: ${chain}`)
          }
        }
      } catch (error) {
        logger.error({
          type: 'ERROR_FETCHING_TOKEN_TRANSACTIONS_V2',
          address: args.address,
          localCurrency: args.localCurrencyCode,
          chain,
          error,
        })
        throw error
      }
    },
    // Deprecated
    tokenTransactions: async (
      _source: any,
      args: TokenTransactionArgs,
      context: Context,
    ) => {
      const { dataSources } = context
      context.localCurrencyCode = args.localCurrencyCode
      try {
        const transactions =
          await dataSources.blockscoutAPI.getTokenTransactions(
            args,
            context.dataSources.currencyConversionAPI,
          )

        return {
          edges: transactions.map((tx) => ({
            node: tx,
            cursor: 'TODO',
          })),
          pageInfo: {
            hasPreviousPage: false,
            hasNextPage: false,
            firstCursor: 'TODO',
            lastCursor: 'TODO',
          },
        }
      } catch (error) {
        logger.error({
          type: 'ERROR_FETCHING_TOKEN_TRANSACTIONS',
          address: args.address,
          localCurrency: args.localCurrencyCode,
          error,
        })
        throw error
      }
    },
    currencyConversion: async (
      _source: any,
      args: CurrencyConversionArgs,
      { dataSources }: Context,
    ) => {
      try {
        const rate = await dataSources.currencyConversionAPI.getExchangeRate({
          ...args,
          // This field is optional for legacy reasons. Remove default value after Valora 1.16 is
          // released and most users update.
          sourceCurrencyCode: args.sourceCurrencyCode ?? USD,
        })
        return { rate: rate.toNumber() }
      } catch (error) {
        logger.error({
          ...args,
          error,
          type: 'CURRENCY_CONVERSION_ERROR',
        })
        return null
      }
    },
    userBalances: async (
      _source: any,
      args: { address: string },
      { dataSources }: Context,
    ): Promise<UserTokenBalances> => {
      try {
        // TODO: remove this once we're confident in the new implementation
        if (FETCH_BALANCES_VIA_BLOCKSCOUT) {
          const balances =
            await dataSources.blockscoutJsonAPI.fetchUserBalances(args.address)
          return { balances }
        }

        const balances = await dataSources.blockchain.fetchUserBalances(
          args.address,
        )
        return { balances }
      } catch (error) {
        logger.error({
          type: 'ERROR_FETCHING_BALANCES',
          address: args.address,
          error,
        })
        throw error
      }
    },
  },
  TokenTransaction: {
    __resolveType(obj: LegacyEventInterface, context: any, info: any) {
      if (obj.type === LegacyEventTypes.EXCHANGE) {
        return 'TokenExchange'
      }
      if (
        obj.type === LegacyEventTypes.RECEIVED ||
        obj.type === LegacyEventTypes.ESCROW_RECEIVED ||
        obj.type === LegacyEventTypes.ESCROW_SENT ||
        obj.type === LegacyEventTypes.SENT ||
        obj.type === LegacyEventTypes.FAUCET ||
        obj.type === LegacyEventTypes.VERIFICATION_FEE
      ) {
        return 'TokenTransfer'
      }
      return null
    },
  },
  TokenTransactionV2: {
    __resolveType(obj: TokenTransactionV2, context: any, info: any) {
      switch (obj.type) {
        case TokenTransactionTypeV2.EXCHANGE:
        case TokenTransactionTypeV2.SWAP_TRANSACTION:
          return 'TokenExchangeV2'
        case TokenTransactionTypeV2.NFT_RECEIVED:
        case TokenTransactionTypeV2.NFT_SENT:
          return 'NftTransferV2'
        case TokenTransactionTypeV2.RECEIVED:
        case TokenTransactionTypeV2.SENT:
        case TokenTransactionTypeV2.INVITE_RECEIVED:
        case TokenTransactionTypeV2.INVITE_SENT:
        case TokenTransactionTypeV2.PAY_REQUEST:
          return 'TokenTransferV2'
      }
    },
  },
  TokenAmount: {
    localAmount: async (
      tokenAmount: TokenAmount,
      args: any,
      context: Context,
    ) => {
      const { dataSources, localCurrencyCode } = context

      if (!localCurrencyCode) {
        return null
      } else {
        try {
          const rate =
            await dataSources.pricesService.getTokenToLocalCurrencyPrice(
              tokenAmount.tokenAddress,
              localCurrencyCode,
              new Date(tokenAmount.timestamp),
            )
          return {
            value: rate.multipliedBy(tokenAmount.value).toString(),
            currencyCode: localCurrencyCode,
            exchangeRate: rate.toString(),
          }
        } catch (error) {
          logger.warn({
            type: 'ERROR_FETCHING_TOKEN_LOCAL_AMOUNT',
            error,
          })
          return null
        }
      }
    },
  },
  MoneyAmount: {
    localAmount: async (
      moneyAmount: MoneyAmount,
      args: any,
      context: Context,
    ) => {
      const { dataSources, localCurrencyCode } = context
      try {
        const rate = await dataSources.currencyConversionAPI.getExchangeRate({
          sourceCurrencyCode: moneyAmount.currencyCode,
          currencyCode: localCurrencyCode || 'USD',
          timestamp: moneyAmount.timestamp,
          impliedExchangeRates: moneyAmount.impliedExchangeRates,
        })
        return {
          value: new BigNumber(moneyAmount.value).multipliedBy(rate).toString(),
          currencyCode: localCurrencyCode || 'USD',
          exchangeRate: rate.toString(),
        }
      } catch (error) {
        logger.warn({
          type: 'ERROR_FETCHING_LOCAL_AMOUNT',
          error,
        })
        return null
      }
    },
  },
}
