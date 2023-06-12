import { BaseDataSource } from '../BaseDataSource'
import { TransactionType } from '../../transaction/TransactionType'
import { AlchemyTransaction } from '../../transaction/alchemy/AlchemyTransaction'
import { PageInfo, Chain, TokenTransactionV2 } from '../../types'
import {
  ClassifiedTransaction,
  TransactionClassifier,
} from '../../transaction/TransactionClassifier'
import {
  NftReceived,
  NftSent,
  TokenReceived,
  TokenSent,
  TokenSwap,
} from '../../events/alchemy'
import { logger } from '../../logger'

type ClassifiedAlchemyTransaction = ClassifiedTransaction<
  AlchemyTransaction,
  TransactionType<AlchemyTransaction>
>

const ALCHEMY_SUPPORTED_CHAINS = [Chain.Ethereum]
export class AlchemyDataSource extends BaseDataSource<
  AlchemyTransaction,
  TransactionType<AlchemyTransaction>
> {
  chain: Chain

  constructor(chain: Chain) {
    super()
    if (!ALCHEMY_SUPPORTED_CHAINS.includes(chain)) {
      throw new Error(`Unsupported chain for Alchemy: ${chain}`)
    }
    this.chain = chain
  }

  async fetchRawTxs(
    _address: string,
    _afterCursor?: string,
  ): Promise<{ transactions: AlchemyTransaction[]; pageInfo: PageInfo }> {
    throw new Error('fetchRawTxs not implemented!')
  }

  classifyTxs(
    address: string,
    txs: AlchemyTransaction[],
    _valoraVersion?: string,
  ): ClassifiedAlchemyTransaction[] {
    const context = { userAddress: address }
    const classifier = new TransactionClassifier<
      AlchemyTransaction,
      TransactionType<AlchemyTransaction>
    >([
      new NftReceived(context),
      new NftSent(context),
      new TokenReceived(context),
      new TokenSent(context),
      new TokenSwap(context),
    ])

    const classifiedTxs: ClassifiedAlchemyTransaction[] = []

    for (const transaction of txs) {
      try {
        classifiedTxs.push(classifier.classify(transaction))
      } catch (err) {
        logger.warn({
          err,
          txReceipt: transaction.txReceipt,
          type: 'ERROR_MAPPING_ALCHEMY_TRANSACTION',
        })
      }
    }

    return classifiedTxs
  }

  serializeTxs(
    _classifiedTxs: ClassifiedAlchemyTransaction[],
  ): TokenTransactionV2[] {
    throw new Error('serializeTxs not implemented!')
  }
}
