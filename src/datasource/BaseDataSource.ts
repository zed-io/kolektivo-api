import { RESTDataSource } from 'apollo-datasource-rest'
import {
  TokenTransactionResult,
  PageInfo,
  TokenTransactionV2,
  Transaction,
} from '../types'
import { ClassifiedTransaction } from '../transaction/TransactionClassifier'
import { TransactionType, isDefined } from '../transaction/TransactionType'
import { logger } from '../logger'
import { fetchFromFirebase } from '../firebase'

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

    // TODO: remove fetching the app version from Firebase in a few months from now (2023/01/06)
    // once the majority of users have updated to a version that includes this info in the User-Agent
    let appVersion = valoraVersion
    if (!appVersion) {
      const userInfo = await fetchFromFirebase(
        `registrations/${address.toLowerCase()}`,
      )
      appVersion = userInfo?.appVersion
    }

    const classifiedTxs = this.classifyTxs(address, transactions, appVersion)

    const serializedTxs: TokenTransactionV2[] = (
      await Promise.all(
        classifiedTxs.map(async ({ transaction, transactionType }) => {
          try {
            return await transactionType.getEvent(transaction)
          } catch (err) {
            logger.warn({
              type: 'ERROR_MAPPING_TO_EVENT_V2',
              transaction: JSON.stringify(transaction),
              err,
            })
          }
        }),
      )
    )
      .filter(isDefined)
      .sort((a, b) => b.timestamp - a.timestamp)

    logger.info({
      type: 'GET_TOKEN_TRANSACTIONS_V2',
      address: address,
      rawTransactionCount: transactions.length,
      pageInfo,
      eventCount: serializedTxs.length,
    })

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
}
