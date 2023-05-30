import { TransactionType } from './TransactionType'
import { Transaction } from '../types'
import { BlockscoutTransactionType } from './blockscout/BlockscoutTransactionType'
import { BlockscoutTransaction } from './blockscout/BlockscoutTransaction'

export interface ClassifiedTransaction<
  T extends Transaction,
  S extends TransactionType<T>,
> {
  transaction: T
  transactionType: S
}

export interface ClassifiedBlockscoutTransaction
  extends ClassifiedTransaction<
    BlockscoutTransaction,
    BlockscoutTransactionType
  > {
  transaction: BlockscoutTransaction
  transactionType: BlockscoutTransactionType
}

export class TransactionClassifier<
  T extends Transaction,
  S extends TransactionType<T>,
> {
  transactionTypes: S[] = []

  constructor(transactionTypes: S[]) {
    this.transactionTypes = transactionTypes
  }

  classify(transaction: T): ClassifiedTransaction<T, S> {
    for (const transactionType of this.transactionTypes) {
      if (transactionType.matches(transaction)) {
        return { transaction, transactionType }
      }
    }

    throw new Error(`Unhandled tx type: ${transaction}`)
  }
}
