import { randomUUID } from 'node:crypto'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type {
  FinanceInstallmentInput,
  FinanceTransactionsRepository,
} from '@repositories/finance-transactions-repository'

// Mesmo horizonte usado na criação (create-finance-transaction.ts) — ao ligar "Fixa" numa
// transação existente, completamos as parcelas que faltam até esse total, contado a partir
// da primeira parcela original (não da parcela mais recente).
const FIXED_EXPENSE_HORIZON_MONTHS = 36

interface UpdateFinanceTransactionInput {
  userId: string
  transactionId: string
  description?: string
  categoryId?: string | null
  isFixed?: boolean
}

interface UpdateFinanceTransactionOutput {
  transaction: Awaited<ReturnType<FinanceTransactionsRepository['update']>>
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

export class UpdateFinanceTransactionUseCase {
  constructor(
    private readonly financeTransactionsRepository: FinanceTransactionsRepository,
    private readonly financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute({
    userId,
    transactionId,
    description,
    categoryId,
    isFixed,
  }: UpdateFinanceTransactionInput): Promise<UpdateFinanceTransactionOutput> {
    if (description === undefined && categoryId === undefined && isFixed === undefined) {
      throw new Error('Nenhum campo para atualizar')
    }

    if (categoryId) {
      const category = await this.financeCategoriesRepository.findById(categoryId)
      if (!category) throw new ResourceNotFoundError()
    }

    const current = await this.financeTransactionsRepository.findById(transactionId, userId)
    if (!current) throw new ResourceNotFoundError()
    // Capturado antes do update: alguns repositórios (ex. in-memory) retornam/atualizam o
    // mesmo objeto por referência, então ler current.isFixed depois do update já estaria mutado.
    const wasFixed = current.isFixed

    let transaction: Awaited<ReturnType<FinanceTransactionsRepository['update']>>
    try {
      transaction = await this.financeTransactionsRepository.update(transactionId, userId, {
        description,
        categoryId: categoryId === undefined ? undefined : categoryId,
        isFixed,
      })
    } catch {
      throw new ResourceNotFoundError()
    }

    if (isFixed !== undefined && isFixed !== wasFixed) {
      await this.applyFixedToggle(transactionId, isFixed)
    }

    return { transaction }
  }

  // Liga: completa as parcelas que faltam (mesmo valor da última parcela existente) até o
  // horizonte. Desliga: apaga as parcelas futuras ainda não vencidas, mantendo o histórico.
  private async applyFixedToggle(transactionId: string, isFixed: boolean): Promise<void> {
    const installments =
      await this.financeTransactionsRepository.findInstallmentsByTransactionId(transactionId)
    if (installments.length === 0) return

    if (isFixed) {
      const missing = FIXED_EXPENSE_HORIZON_MONTHS - installments.length
      if (missing <= 0) return

      const last = installments[installments.length - 1]
      const newInstallments: FinanceInstallmentInput[] = []
      for (let i = 1; i <= missing; i++) {
        newInstallments.push({
          id: randomUUID(),
          transactionId,
          installmentNumber: last.installmentNumber + i,
          amount: last.amount,
          date: addMonths(last.date, i),
        })
      }
      await this.financeTransactionsRepository.createInstallments(newInstallments)
    } else {
      const today = toIsoDate(new Date())
      await this.financeTransactionsRepository.deleteFutureInstallments(transactionId, today)
    }
  }
}
