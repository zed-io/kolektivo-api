import { TokenTransactionV2, Transaction } from '../types'
export interface Context {
  userAddress: string
  tokens?: string[]
}

export abstract class TransactionType<T extends Transaction> {
  protected readonly context!: Context

  constructor(context: Context) {
    this.context = context
  }

  abstract matches(transaction: T): boolean
  abstract getEvent(transaction: T): Promise<TokenTransactionV2>
}

export function isDefined<T>(object: T | undefined): object is T {
  return !!object
}
