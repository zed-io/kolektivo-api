import { ClassifiedBlockscoutTransaction } from '../TransactionClassifier'

/**
 * Aggregates Blockscout transactions based on their type, summing up fees, grouping them into one
 * transaction meaningful for the end user.
 * Starting with the first transaction adds fees for contract calls to the previous
 * transaction of another type.
 *
 * TODO eventually: refactor to not be a static class, which are for namespacing (not needed with modules)
 * or when functions are not first class (not relevant with JS), and either unit test
 * `aggregateContractCallFees` method or combine it with `aggregate`
 */
export class BlockscoutTransactionAggregator {
  static aggregate(
    transactions: ClassifiedBlockscoutTransaction[],
  ): ClassifiedBlockscoutTransaction[] {
    const aggregatedTransactions = transactions.reduce(
      BlockscoutTransactionAggregator.aggregateContractCallFees,
      [],
    )

    return aggregatedTransactions.filter((t) => t)
  }

  static aggregateContractCallFees(
    accumulator: ClassifiedBlockscoutTransaction[],
    currentTransaction: ClassifiedBlockscoutTransaction,
  ): ClassifiedBlockscoutTransaction[] {
    if (
      currentTransaction.transactionType.isAggregatable &&
      accumulator.length > 0
    ) {
      const transactionFees = currentTransaction.transaction.fees

      transactionFees.forEach((fee) =>
        accumulator[accumulator.length - 1].transaction.addFee(fee),
      )
    } else {
      accumulator.push(currentTransaction)
    }

    return accumulator
  }
}
