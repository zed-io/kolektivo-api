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
  BlockscoutChain,
} from './types'
import { isAlchemyChain } from './datasource/alchemy/AlchemyDataSource'
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
      const chain = args.chain ?? BlockscoutChain.Celo
      try {
        if (isAlchemyChain(chain)) {
          return await dataSources.alchemyDataSourceManager
            .getDataSource(chain)
            .getTokenTxs(args.address, args.afterCursor, valoraVersion)
        } else if (chain === BlockscoutChain.Celo) {
          return await dataSources.blockscout.getTokenTxs(
            args.address,
            args.afterCursor,
            valoraVersion,
          )
        } else {
          throw new Error(`Unknown chain parameter: ${chain}`)
        }
      } catch (err) {
        logger.error({
          type: 'ERROR_FETCHING_TOKEN_TRANSACTIONS_V2',
          address: args.address,
          localCurrency: args.localCurrencyCode,
          chain,
          err,
        })
        throw err
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
          await dataSources.legacyBlockscoutAPI.getTokenTransactions(
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
      } catch (err) {
        logger.error({
          type: 'ERROR_FETCHING_TOKEN_TRANSACTIONS',
          address: args.address,
          localCurrency: args.localCurrencyCode,
          err,
        })
        throw err
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
      } catch (err) {
        logger.error({
          ...args,
          err,
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
      } catch (err) {
        logger.error({
          type: 'ERROR_FETCHING_BALANCES',
          address: args.address,
          err,
        })
        throw err
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
        } catch (err) {
          logger.warn({
            type: 'ERROR_FETCHING_TOKEN_LOCAL_AMOUNT',
            err,
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
      } catch (err) {
        logger.warn({
          type: 'ERROR_FETCHING_LOCAL_AMOUNT',
          err,
        })
        return null
      }
    },
  },
}
