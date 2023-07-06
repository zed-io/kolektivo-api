import { AlchemyChain, Chain, TokenTransactionV2, Transaction } from '../types'
import { AlchemyTransaction } from './alchemy/AlchemyTransaction'

export type Context<C extends Chain | AlchemyChain> = {
  userAddress: string
  chain: C
  tokens?: string[]
}

export abstract class TransactionType<T extends Transaction> {
  protected readonly context!: Context<
    T extends AlchemyTransaction ? AlchemyChain : Chain
  >

  constructor(
    context: Context<T extends AlchemyTransaction ? AlchemyChain : Chain>,
  ) {
    this.context = context
  }

  abstract matches(transaction: T): boolean

  abstract getEvent(transaction: T): Promise<TokenTransactionV2>
}

export function isDefined<T>(object: T | undefined): object is T {
  return !!object
}
