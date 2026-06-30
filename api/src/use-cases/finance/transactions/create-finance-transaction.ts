import { randomUUID } from 'node:crypto'
import { FinanceTransactionLimitExceededError } from '@errors/finance-transaction-limit-exceeded-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type {
  FinanceInstallmentInput,
  FinanceInstallmentRecord,
  FinanceTransactionsRepository,
  FinanceTransactionType,
} from '@repositories/finance-transactions-repository'

const TRANSACTION_LIMIT_PER_USER = 500
const MAX_INSTALLMENTS = 24
const MAX_DESCRIPTION_LENGTH = 200
// Despesas fixas (isFixed) não dividem o valor — repetem o totalAmount cheio todo mês,
// materializado como parcelas reais por esse horizonte à frente da data de início.
const FIXED_EXPENSE_HORIZON_MONTHS = 36

interface CreateFinanceTransactionInput {
  userId: string
  type: FinanceTransactionType
  description: string
  categoryId: string | null
  totalAmount: number
  installmentsCount?: number
  firstInstallmentDate?: string
  isFixed?: boolean
}

interface CreateFinanceTransactionOutput {
  transaction: Awaited<ReturnType<FinanceTransactionsRepository['create']>>
  installments: FinanceInstallmentRecord[]
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addMonths(iso: string, n: number): string {
  const [y, m, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, day))
  date.setUTCMonth(date.getUTCMonth() + n)
  return toIsoDate(date)
}

export class CreateFinanceTransactionUseCase {
  constructor(
    private readonly financeTransactionsRepository: FinanceTransactionsRepository,
    private readonly financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute({
    userId,
    type,
    description,
    categoryId,
    totalAmount,
    installmentsCount = 1,
    firstInstallmentDate,
    isFixed = false,
  }: CreateFinanceTransactionInput): Promise<CreateFinanceTransactionOutput> {
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new Error('totalAmount deve ser positivo')
    }
    if (
      !isFixed &&
      (!Number.isInteger(installmentsCount) ||
        installmentsCount < 1 ||
        installmentsCount > MAX_INSTALLMENTS)
    ) {
      throw new Error(`installmentsCount deve estar entre 1 e ${MAX_INSTALLMENTS}`)
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`description máximo ${MAX_DESCRIPTION_LENGTH} caracteres`)
    }

    const count = await this.financeTransactionsRepository.countByUserId(userId)
    if (count >= TRANSACTION_LIMIT_PER_USER) {
      throw new FinanceTransactionLimitExceededError()
    }

    if (categoryId) {
      const category = await this.financeCategoriesRepository.findById(categoryId)
      if (!category) throw new ResourceNotFoundError()
    }

    const transactionId = randomUUID()
    const firstDate = firstInstallmentDate ?? toIsoDate(new Date())
    // Despesa fixa: valor cheio repete por FIXED_EXPENSE_HORIZON_MONTHS, sem dividir.
    // Parcelamento normal: o total é dividido pelo número de parcelas escolhido.
    const effectiveCount = isFixed ? FIXED_EXPENSE_HORIZON_MONTHS : installmentsCount
    const installmentAmount = isFixed
      ? totalAmount.toFixed(10)
      : (totalAmount / installmentsCount).toFixed(10)

    const transaction = await this.financeTransactionsRepository.create({
      id: transactionId,
      userId,
      type,
      description,
      categoryId,
      totalAmount: totalAmount.toFixed(10),
      installmentsCount: effectiveCount,
      source: 'principal',
      isFixed,
    })

    const installmentInputs: FinanceInstallmentInput[] = []
    for (let n = 1; n <= effectiveCount; n++) {
      installmentInputs.push({
        id: randomUUID(),
        transactionId,
        installmentNumber: n,
        amount: installmentAmount,
        date: addMonths(firstDate, n - 1),
      })
    }

    const installments =
      await this.financeTransactionsRepository.createInstallments(installmentInputs)

    return { transaction, installments }
  }
}
