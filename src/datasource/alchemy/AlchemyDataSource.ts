import { BaseDataSource } from '../BaseDataSource'
import { TransactionType } from '../../transaction/TransactionType'
import { AlchemyTransaction } from '../../transaction/alchemy/AlchemyTransaction'
import { PageInfo, Chain, TokenTransactionV2 } from '../../types'
import { ClassifiedTransaction } from '../../transaction/TransactionClassifier'

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
    _txs: AlchemyTransaction[],
    _valoraVersion?: string,
  ): ClassifiedAlchemyTransaction[] {
    throw new Error('classifyTxs not implemented!')
  }

  serializeTxs(
    _classifiedTxs: ClassifiedAlchemyTransaction[],
  ): TokenTransactionV2[] {
    throw new Error('serializeTxs not implemented!')
  }
}
