import { TransactionType } from '../TransactionType'
import { BlockscoutTransaction } from './BlockscoutTransaction'

/**
 * Transaction types for Blockscout transfers, which must specify whether or not the transaction is
 * aggregatable.
 */
export abstract class BlockscoutTransactionType extends TransactionType<BlockscoutTransaction> {
  abstract readonly isAggregatable: boolean
}
