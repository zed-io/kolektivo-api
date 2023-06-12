import { RESTDataSource } from 'apollo-datasource-rest'
import {
  TokenTransactionResult,
  PageInfo,
  TokenTransactionV2,
  Transaction,
} from '../types'
import { ClassifiedTransaction } from '../transaction/TransactionClassifier'
import { TransactionType } from '../transaction/TransactionType'

/**
 * Base class from which to build datasources for blockchain transaction data.
 *
 * This class is abstract in order to support multiple different internal
 * representations for transaction data from distinct data sources, while
 * still allowing the "steps" of transaction fetching to be logically grouped.
 * This is largely a workaround to avoid having to modify/generalize our current
 * Blockscout transaction representation.
 *
 * Getting transaction data is grouped into three distinct parts:
 *  * Fetching the raw transaction data from the source and shaping it into the desired structure
 *  * Classifying transactions based on their type, filtering, and optional aggregation
 *  * Serializing the resulting transfers
 */
export abstract class BaseDataSource<
  T extends Transaction,
  S extends TransactionType<T>,
> extends RESTDataSource {
  /**
   * Fetch serialized token transactions from the datasource.
   */
  async getTokenTxs(
    address: string,
    afterCursor?: string,
    valoraVersion?: string,
  ): Promise<TokenTransactionResult> {
    const { transactions, pageInfo } = await this.fetchRawTxs(
      address,
      afterCursor,
    )
    const classifiedTxs = this.classifyTxs(address, transactions, valoraVersion)
    const serializedTxs = this.serializeTxs(classifiedTxs)
    return {
      transactions: serializedTxs,
      pageInfo,
    }
  }

  /**
   * Fetch raw transaction data from the desired datasource. Returns a list of transactions
   * in the desired representation for further processing, as well as page information.
   */
  abstract fetchRawTxs(
    address: string,
    afterCursor?: string,
  ): Promise<{
    transactions: T[]
    pageInfo: PageInfo
  }>

  /**
   * Classify and filter transactions depending on their type. Optionally accepts the user's
   * Valora version to aid in filtering unsupported transaction types.
   */
  abstract classifyTxs(
    address: string,
    txs: T[],
    valoraVersion?: string,
  ): ClassifiedTransaction<T, S>[]

  /**
   * Serialize transactions into the form expected by the GraphQL contract.
   */
  abstract serializeTxs(
    classifiedTxs: ClassifiedTransaction<T, S>[],
  ): TokenTransactionV2[]
}
