import * as React from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Calendar,
  Search,
  Inbox
} from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { AppShell } from '@layouts/AppShell';
import { ConfirmModal } from '@ui/ConfirmModal';
import { 
  useGetFinanceCategories,
  useGetFinanceTransactions,
  usePostFinanceTransactions,
  useDeleteFinanceTransactionsId,
  usePutFinanceTransactionsId,
  useGetFinanceSummary,
  useGetFinanceCreditCardExpenses,
  usePostFinanceCreditCardExpenses,
  usePutFinanceCreditCardExpensesId,
  useDeleteFinanceCreditCardExpensesId,
  usePatchFinanceCreditCardExpensesIdLaunch,
  usePatchFinanceCreditCardExpensesIdUnlaunch,
  getFinanceTransactionsQueryKey,
  getFinanceSummaryQueryKey,
  getFinanceCreditCardExpensesQueryKey
} from '@core/api/gen/hooks';

export const Route = createFileRoute('/financas')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/',
      });
    }
  },
  component: FinancasComponent,
});

function FinancasComponent() {
  const queryClient = useQueryClient();

  // Navegação de Abas: 'transacoes' | 'cartao'
  const [activeSubTab, setActiveSubTab] = React.useState<'transacoes' | 'cartao'>('transacoes');

  // Mês de referência (default: mês atual YYYY-MM)
  const [selectedMonth, setSelectedMonth] = React.useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Filtros
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Estados de Modais
  const [isCreateTxOpen, setIsCreateTxOpen] = React.useState(false);
  const [editingTx, setEditingTx] = React.useState<any | null>(null);
  const [deletingTxId, setDeletingTxId] = React.useState<string | null>(null);

  const [isCreateCCOpen, setIsCreateCCOpen] = React.useState(false);
  const [editingCC, setEditingCC] = React.useState<any | null>(null);
  const [deletingCCId, setDeletingCCId] = React.useState<string | null>(null);

  // Estados dos Formulários
  const [formType, setFormType] = React.useState<'expense' | 'income'>('expense');
  const [formDescription, setFormDescription] = React.useState('');
  const [formCategoryId, setFormCategoryId] = React.useState('');
  const [formTotalAmount, setFormTotalAmount] = React.useState('');
  const [formInstallmentsCount, setFormInstallmentsCount] = React.useState('1');
  const [formDate, setFormDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [formMyShareAmount, setFormMyShareAmount] = React.useState('');
  const [autoDivide, setAutoDivide] = React.useState(true);
  const [formIsFixed, setFormIsFixed] = React.useState(false);

  // Queries
  const [year, month] = selectedMonth.split('-').map(Number);
  const fromDate = `${selectedMonth}-01`;
  const toDate = `${selectedMonth}-${new Date(year, month, 0).getDate()}`;

  // Buscar Categorias
  const { data: categoriesData } = useGetFinanceCategories();
  const categories = categoriesData?.categories || [];

  // Buscar Transações Principais
  const { 
    data: txsData, 
    isLoading: isLoadingTxs, 
    refetch: refetchTxs 
  } = useGetFinanceTransactions({
    from: fromDate,
    to: toDate,
    search: searchQuery || undefined,
    categoryId: selectedCategory !== 'all' ? selectedCategory : undefined
  });
  const transactions = txsData?.transactions || [];

  // Buscar Resumo Mensal
  const { data: summaryData, refetch: refetchSummary } = useGetFinanceSummary({
    month: selectedMonth
  });

  // Buscar Despesas do Cartão
  const { 
    data: ccData, 
    isLoading: isLoadingCC, 
    refetch: refetchCC 
  } = useGetFinanceCreditCardExpenses({
    month: selectedMonth
  });
  const creditCardExpenses = ccData?.expenses || [];

  // Mutações - Transações
  const { mutateAsync: createTx, isPending: isCreatingTx } = usePostFinanceTransactions();
  const { mutateAsync: updateTx, isPending: isUpdatingTx } = usePutFinanceTransactionsId();
  const { mutateAsync: deleteTx, isPending: isDeletingTx } = useDeleteFinanceTransactionsId();

  // Mutações - Cartão
  const { mutateAsync: createCC, isPending: isCreatingCC } = usePostFinanceCreditCardExpenses();
  const { mutateAsync: updateCC, isPending: isUpdatingCC } = usePutFinanceCreditCardExpensesId();
  const { mutateAsync: deleteCC, isPending: isDeletingCC } = useDeleteFinanceCreditCardExpensesId();
  const { mutateAsync: launchCC } = usePatchFinanceCreditCardExpensesIdLaunch();
  const { mutateAsync: unlaunchCC } = usePatchFinanceCreditCardExpensesIdUnlaunch();

  // Atualiza "Minha Parte" automaticamente ao digitar o total (se auto-divide ativo)
  React.useEffect(() => {
    if (autoDivide && formTotalAmount) {
      const val = parseFloat(formTotalAmount);
      if (!isNaN(val)) {
        setFormMyShareAmount((val / 2).toFixed(2));
      }
    }
  }, [formTotalAmount, autoDivide]);

  // Limpar formulários
  const resetForms = () => {
    setFormDescription('');
    setFormCategoryId('');
    setFormTotalAmount('');
    setFormInstallmentsCount('1');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMyShareAmount('');
    setAutoDivide(true);
    setFormType('expense');
    setFormIsFixed(false);
  };

  // Invalidar Queries
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getFinanceTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getFinanceSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getFinanceCreditCardExpensesQueryKey() });
    refetchTxs();
    refetchSummary();
    refetchCC();
  };

  // Formatação Monetária
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Salvar Transação
  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription || !formTotalAmount) {
      toast.error('Preencha a descrição e o valor.');
      return;
    }

    try {
      if (editingTx) {
        await updateTx({
          id: editingTx.id,
          data: {
            description: formDescription,
            categoryId: formCategoryId || undefined,
            isFixed: formIsFixed
          }
        });
        toast.success('Transação atualizada com sucesso.');
      } else {
        await createTx({
          data: {
            type: formType,
            description: formDescription,
            categoryId: formCategoryId || undefined,
            totalAmount: parseFloat(formTotalAmount),
            installmentsCount: parseInt(formInstallmentsCount, 10),
            firstInstallmentDate: formDate,
            isFixed: formIsFixed
          }
        });
        toast.success('Transação registrada.');
      }
      setIsCreateTxOpen(false);
      setEditingTx(null);
      resetForms();
      invalidateAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar transação.');
    }
  };

  // Deletar Transação
  const handleDeleteTx = async () => {
    if (!deletingTxId) return;
    try {
      await deleteTx({ id: deletingTxId });
      toast.success('Transação excluída.');
      setDeletingTxId(null);
      invalidateAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao excluir transação.');
    }
  };

  // Salvar Cartão
  const handleSaveCC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription || !formTotalAmount) {
      toast.error('Preencha a descrição e o valor.');
      return;
    }

    try {
      if (editingCC) {
        await updateCC({
          id: editingCC.id,
          data: {
            description: formDescription,
            categoryId: formCategoryId || undefined,
            totalAmount: parseFloat(formTotalAmount),
            myShareAmount: parseFloat(formMyShareAmount || (parseFloat(formTotalAmount) / 2).toString()),
            date: formDate
          }
        });
        toast.success('Despesa de cartão atualizada.');
      } else {
        await createCC({
          data: {
            description: formDescription,
            categoryId: formCategoryId || undefined,
            totalAmount: parseFloat(formTotalAmount),
            myShareAmount: parseFloat(formMyShareAmount || (parseFloat(formTotalAmount) / 2).toString()),
            date: formDate
          }
        });
        toast.success('Despesa de cartão registrada.');
      }
      setIsCreateCCOpen(false);
      setEditingCC(null);
      resetForms();
      invalidateAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar despesa de cartão.');
    }
  };

  // Deletar Cartão
  const handleDeleteCC = async () => {
    if (!deletingCCId) return;
    try {
      await deleteCC({ id: deletingCCId });
      toast.success('Despesa de cartão excluída.');
      setDeletingCCId(null);
      invalidateAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao excluir despesa.');
    }
  };

  // Lançar no Principal
  const handleLaunch = async (id: string) => {
    try {
      await launchCC({ id });
      toast.success('Valor lançado na tabela de transações principal.');
      invalidateAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao lançar transação.');
    }
  };

  // Estornar do Principal
  const handleUnlaunch = async (id: string) => {
    try {
      await unlaunchCC({ id });
      toast.success('Lançamento estornado do principal.');
      invalidateAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao estornar lançamento.');
    }
  };

  // Abrir Edição Transação
  const openEditTx = (tx: any) => {
    setEditingTx(tx);
    setFormDescription(tx.description);
    setFormCategoryId(tx.category?.id || '');
    setFormTotalAmount(tx.totalAmount.toString());
    setFormInstallmentsCount(tx.installmentsCount.toString());
    setFormDate(tx.date);
    setFormType(tx.type);
    setFormIsFixed(tx.isFixed);
    setIsCreateTxOpen(true);
  };

  // Abrir Edição Cartão
  const openEditCC = (cc: any) => {
    setEditingCC(cc);
    setFormDescription(cc.description);
    setFormCategoryId(cc.category?.id || '');
    setFormTotalAmount(cc.totalAmount.toString());
    setFormMyShareAmount(cc.myShareAmount.toString());
    setFormDate(cc.date);
    setAutoDivide(false);
    setIsCreateCCOpen(true);
  };

  // Cômputo local de totais do cartão
  const ccTotals = React.useMemo(() => {
    return creditCardExpenses.reduce((acc, curr) => {
      acc.total += curr.totalAmount;
      acc.myShare += curr.myShareAmount;
      if (curr.launchedInMain) {
        acc.launched += curr.myShareAmount;
      }
      return acc;
    }, { total: 0, myShare: 0, launched: 0 });
  }, [creditCardExpenses]);

  // Skeletons de carregamento
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="p-4"><div className="h-4 bg-secondary/40 rounded w-2/3" /></td>
      <td className="p-4"><div className="h-4 bg-secondary/40 rounded w-1/2" /></td>
      <td className="p-4"><div className="h-4 bg-secondary/40 rounded w-1/3" /></td>
      <td className="p-4"><div className="h-4 bg-secondary/40 rounded w-1/2" /></td>
      <td className="p-4"><div className="h-4 bg-secondary/40 rounded w-1/3" /></td>
      <td className="p-4"><div className="h-4 bg-secondary/40 rounded w-1/4" /></td>
      <td className="p-4 text-right"><div className="h-4 bg-secondary/40 rounded w-8 ml-auto" /></td>
    </tr>
  );

  const SkeletonCard = () => (
    <div className="p-4 rounded-lg border border-border bg-card flex flex-col gap-3 animate-pulse font-mono">
      <div className="flex justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-secondary/40 rounded w-2/3" />
          <div className="h-3 bg-secondary/30 rounded w-1/2" />
        </div>
        <div className="h-5 bg-secondary/40 rounded w-16" />
      </div>
      <div className="border-t border-border/50 pt-2.5 flex justify-between">
        <div className="h-3 bg-secondary/30 rounded w-1/3" />
        <div className="h-3 bg-secondary/30 rounded w-10" />
      </div>
    </div>
  );

  return (
    <AppShell activeTab="financas">
      {/* ========================================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col gap-6 p-6 pb-24 md:p-8 md:pb-8 lg:px-16 lg:py-12 w-full max-w-[1440px] mx-auto overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground">
              Finanças
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Gerencie suas receitas, despesas e parcelamentos
            </p>
          </div>

          {/* Seletor de Mês */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-1.5 w-fit hover:border-primary/40 transition-colors duration-150">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-xs font-mono text-foreground focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABS (Transações / Cartão de Crédito) */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 border-b border-border pb-px">
          <button
            onClick={() => setActiveSubTab('transacoes')}
            className={`px-4 py-2 font-mono text-xs font-semibold rounded-t-md transition-all duration-150 border-b-2 cursor-pointer ${
              activeSubTab === 'transacoes'
                ? 'border-primary text-foreground bg-secondary/30'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Transações
          </button>
          <button
            onClick={() => setActiveSubTab('cartao')}
            className={`px-4 py-2 font-mono text-xs font-semibold rounded-t-md transition-all duration-150 border-b-2 cursor-pointer ${
              activeSubTab === 'cartao'
                ? 'border-primary text-foreground bg-secondary/30'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Cartão de Crédito
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ABA: TRANSAÇÕES */}
        {/* ========================================================================= */}
        {activeSubTab === 'transacoes' && (
          <div className="space-y-6 flex-1 flex flex-col transition-all duration-150 ease-out">
            
            {/* Filtros e Busca */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
                {/* Campo de Busca */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar transação..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 font-mono text-xs h-9 focus:border-primary/60 transition-colors"
                  />
                </div>

                {/* Filtro de Categoria */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 rounded-md border border-border bg-card px-3 py-1 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-primary/50 cursor-pointer hover:border-primary/30 transition-colors"
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => { setFormType('expense'); setIsCreateTxOpen(true); }}
                  className="font-mono text-xs h-9 hover:bg-secondary/40 transition-colors cursor-pointer"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Nova Despesa
                </Button>
                <Button 
                  onClick={() => { setFormType('income'); setIsCreateTxOpen(true); }}
                  className="font-mono text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Nova Receita
                </Button>
              </div>
            </div>

            {/* Tabela de Transações (Desktop/Tablet) */}
            <div className="hidden md:block overflow-hidden border border-border rounded-lg bg-card">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-secondary/10">
                    <th className="p-4 font-semibold w-[30%]">Transação</th>
                    <th className="p-4 font-semibold w-[15%]">Valor</th>
                    <th className="p-4 font-semibold w-[12%]">Tipo</th>
                    <th className="p-4 font-semibold w-[18%]">Categoria</th>
                    <th className="p-4 font-semibold w-[12%]">Data</th>
                    <th className="p-4 font-semibold w-[13%]">Parcelas</th>
                    <th className="p-4 font-semibold w-[10%] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoadingTxs ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3 py-6">
                          <Inbox className="h-8 w-8 text-muted-foreground/40" />
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">Nenhuma transação encontrada</p>
                            <p className="text-[11px] text-muted-foreground max-w-[280px] mx-auto">
                              Registre suas receitas e despesas usando os botões acima para começar o controle financeiro do mês.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-secondary/5 transition-colors duration-150">
                        <td className="p-4 font-medium text-foreground max-w-[300px] truncate" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className={`p-4 font-semibold ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                          {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.totalAmount)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {tx.type === 'income' ? 'Receita' : 'Despesa'}
                          </span>
                        </td>
                        <td className="p-4">
                          {tx.category ? (
                            <span 
                              className="px-2 py-0.5 rounded text-[10px] border"
                              style={{
                                borderColor: `${tx.category.color}25`,
                                color: tx.category.color,
                                backgroundColor: `${tx.category.color}12`
                              }}
                            >
                              {tx.category.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {tx.date}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {tx.isFixed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/20">
                              Fixa
                            </span>
                          ) : tx.installmentsCount > 1 ? (
                            `${tx.currentInstallment || 1} / ${tx.installmentsCount}`
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {tx.source === 'principal' && (
                              <button
                                onClick={() => openEditTx(tx)}
                                className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeletingTxId(tx.id)}
                              className="p-1.5 rounded hover:bg-secondary text-rose-500/80 hover:text-rose-500 transition-all duration-150 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
              {isLoadingTxs ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              ) : transactions.length === 0 ? (
                <div className="p-12 border border-border rounded-lg bg-card text-center text-xs text-muted-foreground font-mono flex flex-col items-center justify-center gap-3">
                  <Inbox className="h-8 w-8 text-muted-foreground/40" />
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Nenhuma transação encontrada</p>
                    <p className="text-[10px] text-muted-foreground max-w-[240px] mx-auto">
                      Adicione receitas ou despesas usando os botões acima.
                    </p>
                  </div>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-4 rounded-lg border border-border bg-card flex flex-col gap-3 font-mono text-xs hover:border-primary/30 transition-colors duration-150">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground break-all">{tx.description}</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] border ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {tx.type === 'income' ? 'Receita' : 'Despesa'}
                          </span>
                          {tx.category && (
                            <span 
                              className="px-1.5 py-0.5 rounded text-[9px] border"
                              style={{
                                borderColor: `${tx.category.color}25`,
                                color: tx.category.color,
                                backgroundColor: `${tx.category.color}12`
                              }}
                            >
                              {tx.category.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                        {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-muted-foreground text-[10px]">
                      <div className="flex items-center gap-3">
                        <span>{tx.date}</span>
                        {tx.isFixed ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold border bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/20">
                            Fixa
                          </span>
                        ) : tx.installmentsCount > 1 && (
                          <span>Parc: {tx.currentInstallment}/{tx.installmentsCount}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {tx.source === 'principal' && (
                          <button
                            onClick={() => openEditTx(tx)}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingTxId(tx.id)}
                          className="p-1 rounded hover:bg-secondary text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Resumo Mensal */}
            <div className="p-4 md:p-5 rounded-lg border border-border bg-secondary/10 flex flex-col gap-4 mt-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider font-mono text-foreground">
                  Resumo Mensal
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-md border border-border bg-card flex flex-col gap-1.5 hover:border-primary/25 transition-colors duration-150">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                    Receitas
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-500">
                    {formatBRL(summaryData?.income || 0)}
                  </span>
                </div>

                <div className="p-4 rounded-md border border-border bg-card flex flex-col gap-1.5 hover:border-primary/25 transition-colors duration-150">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                    Despesas
                  </span>
                  <span className="text-base font-bold font-mono text-rose-500">
                    {formatBRL(summaryData?.expenses || 0)}
                  </span>
                </div>

                <div className="p-4 rounded-md border border-border bg-card flex flex-col gap-1.5 hover:border-primary/25 transition-colors duration-150">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                    Saldo Efetivo
                  </span>
                  <span className="text-base font-bold font-mono text-[#6366f1]">
                    {formatBRL(summaryData?.balance || 0)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA: CARTÃO DE CRÉDITO */}
        {/* ========================================================================= */}
        {activeSubTab === 'cartao' && (
          <div className="space-y-6 flex-1 flex flex-col transition-all duration-150 ease-out">
            
            {/* Ações */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                Acompanhamento e divisão de despesas do cartão de crédito
              </span>
              <Button 
                onClick={() => { setIsCreateCCOpen(true); }}
                className="font-mono text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground ml-auto transition-colors cursor-pointer"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nova Despesa no Cartão
              </Button>
            </div>

            {/* Tabela (Desktop/Tablet) */}
            <div className="hidden md:block overflow-hidden border border-border rounded-lg bg-card">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-secondary/10">
                    <th className="p-4 font-semibold w-[25%]">Despesa</th>
                    <th className="p-4 font-semibold w-[15%]">Valor Total</th>
                    <th className="p-4 font-semibold w-[15%] text-[#6366f1]">Minha Parte</th>
                    <th className="p-4 font-semibold w-[15%]">Categoria</th>
                    <th className="p-4 font-semibold w-[12%]">Data</th>
                    <th className="p-4 font-semibold w-[18%]">Lançado no Principal?</th>
                    <th className="p-4 font-semibold w-[10%] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoadingCC ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : creditCardExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3 py-6">
                          <Inbox className="h-8 w-8 text-muted-foreground/40" />
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">Nenhuma despesa de cartão encontrada</p>
                            <p className="text-[11px] text-muted-foreground max-w-[280px] mx-auto">
                              Adicione suas compras no cartão de crédito para dividir o valor e lançar a sua parte na tabela principal.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    creditCardExpenses.map((cc) => (
                      <tr key={cc.id} className="hover:bg-secondary/5 transition-colors duration-150">
                        <td className="p-4 font-medium text-foreground max-w-[200px] truncate" title={cc.description}>
                          {cc.description}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {formatBRL(cc.totalAmount)}
                        </td>
                        <td className="p-4 font-bold text-[#6366f1]">
                          {formatBRL(cc.myShareAmount)}
                        </td>
                        <td className="p-4">
                          {cc.category ? (
                            <span 
                              className="px-2 py-0.5 rounded text-[10px] border"
                              style={{
                                borderColor: `${cc.category.color}25`,
                                color: cc.category.color,
                                backgroundColor: `${cc.category.color}12`
                              }}
                            >
                              {cc.category.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {cc.date}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              cc.launchedInMain
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-secondary/40 text-muted-foreground border-border'
                            }`}>
                              {cc.launchedInMain ? 'Sim' : 'Não'}
                            </span>
                            
                            {cc.launchedInMain ? (
                              <button 
                                onClick={() => handleUnlaunch(cc.id)}
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-150"
                              >
                                Estornar
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleLaunch(cc.id)}
                                className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-150"
                              >
                                Lançar
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditCC(cc)}
                              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
                              title="Editar"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingCCId(cc.id)}
                              className="p-1.5 rounded hover:bg-secondary text-rose-500/80 hover:text-rose-500 transition-all duration-150 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
              {isLoadingCC ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              ) : creditCardExpenses.length === 0 ? (
                <div className="p-12 border border-border rounded-lg bg-card text-center text-xs text-muted-foreground font-mono flex flex-col items-center justify-center gap-3">
                  <Inbox className="h-8 w-8 text-muted-foreground/40" />
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">Nenhuma despesa encontrada</p>
                    <p className="text-[10px] text-muted-foreground max-w-[240px] mx-auto">
                      Adicione despesas do cartão usando o botão acima.
                    </p>
                  </div>
                </div>
              ) : (
                creditCardExpenses.map((cc) => (
                  <div key={cc.id} className="p-4 rounded-lg border border-border bg-card flex flex-col gap-3 font-mono text-xs hover:border-primary/30 transition-colors duration-150">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground break-all">{cc.description}</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground font-semibold">Total: {formatBRL(cc.totalAmount)}</span>
                          {cc.category && (
                            <span 
                              className="px-1.5 py-0.5 rounded text-[9px] border"
                              style={{
                                borderColor: `${cc.category.color}25`,
                                color: cc.category.color,
                                backgroundColor: `${cc.category.color}12`
                              }}
                            >
                              {cc.category.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="font-bold text-[#6366f1] text-sm shrink-0">
                        {formatBRL(cc.myShareAmount)} (50%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-muted-foreground text-[10px]">
                      <div className="flex items-center gap-3">
                        <span>{cc.date}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={cc.launchedInMain ? 'text-emerald-500 font-semibold' : ''}>
                            {cc.launchedInMain ? 'Lançado' : 'Não lançado'}
                          </span>
                          <span>•</span>
                          {cc.launchedInMain ? (
                            <button onClick={() => handleUnlaunch(cc.id)} className="text-rose-500 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors">
                              Estornar
                            </button>
                          ) : (
                            <button onClick={() => handleLaunch(cc.id)} className="text-emerald-500 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors">
                              Lançar
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCC(cc)}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCCId(cc.id)}
                          className="p-1 rounded hover:bg-secondary text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Resumo do Cartão */}
            <div className="p-4 md:p-5 rounded-lg border border-border bg-secondary/10 flex flex-col gap-4 mt-auto">
              <h3 className="text-[11px] font-bold uppercase tracking-wider font-mono text-foreground">
                Resumo do Cartão (Fatura Atual)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-md border border-border bg-card flex flex-col gap-1.5 hover:border-primary/25 transition-colors duration-150">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                    Total Fatura
                  </span>
                  <span className="text-base font-bold font-mono text-rose-500">
                    {formatBRL(ccTotals.total)}
                  </span>
                </div>

                <div className="p-4 rounded-md border border-border bg-card flex flex-col gap-1.5 hover:border-primary/25 transition-colors duration-150">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                    Minha Parte
                  </span>
                  <span className="text-base font-bold font-mono text-[#6366f1]">
                    {formatBRL(ccTotals.myShare)}
                  </span>
                </div>

                <div className="p-4 rounded-md border border-border bg-card flex flex-col gap-1.5 hover:border-primary/25 transition-colors duration-150">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                    Lançado no Principal
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-500">
                    {formatBRL(ccTotals.launched)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NOVA/EDITAR TRANSAÇÃO */}
      {/* ========================================================================= */}
      {isCreateTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 flex flex-col gap-5 font-mono text-xs shadow-xl animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">
                {editingTx ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {editingTx ? 'Altere as informações da transação.' : 'Registre uma receita ou despesa avulsa.'}
              </p>
            </div>

            <form onSubmit={handleSaveTx} className="space-y-4">
              {!editingTx && (
                <div className="flex gap-2 p-1 bg-secondary/30 rounded-md border border-border">
                  <button
                    type="button"
                    onClick={() => setFormType('expense')}
                    className={`flex-1 py-1.5 text-center rounded-md font-semibold cursor-pointer transition-all duration-150 ${
                      formType === 'expense' 
                        ? 'bg-card text-rose-500 border border-border shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('income')}
                    className={`flex-1 py-1.5 text-center rounded-md font-semibold cursor-pointer transition-all duration-150 ${
                      formType === 'income' 
                        ? 'bg-card text-emerald-500 border border-border shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase">Descrição</label>
                <Input
                  required
                  placeholder="Ex: Pia banheiro, Salário..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase">Categoria</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-primary/50 cursor-pointer"
                >
                  <option value="">Nenhuma</option>
                  {categories
                    .filter(cat => cat.type === (editingTx ? editingTx.type : formType))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase">Valor Total (R$)</label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  disabled={!!editingTx}
                  placeholder="0,00"
                  value={formTotalAmount}
                  onChange={(e) => setFormTotalAmount(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsFixed}
                    onChange={(e) => setFormIsFixed(e.target.checked)}
                    className="rounded bg-card border-border text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                  />
                  Despesa fixa (repete todo mês com o mesmo valor)
                </label>
              </div>

              {!editingTx && (
                <div className={formIsFixed ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"}>
                  {!formIsFixed && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-semibold uppercase">Parcelas</label>
                      <select
                        value={formInstallmentsCount}
                        onChange={(e) => setFormInstallmentsCount(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-xs text-foreground focus-visible:outline-none cursor-pointer"
                      >
                        {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}x</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-semibold uppercase">
                      {formIsFixed ? 'Data de Início' : 'Data da Compra'}
                    </label>
                    <Input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setIsCreateTxOpen(false); setEditingTx(null); resetForms(); }}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreatingTx || isUpdatingTx}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                >
                  {isCreatingTx || isUpdatingTx ? 'Salvando...' : 'Confirmar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA/EDITAR DESPESA NO CARTÃO */}
      {/* ========================================================================= */}
      {isCreateCCOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 flex flex-col gap-5 font-mono text-xs shadow-xl animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">
                {editingCC ? 'Editar Despesa de Cartão' : 'Nova Despesa no Cartão'}
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Registre compras no cartão de crédito para posterior divisão.
              </p>
            </div>

            <form onSubmit={handleSaveCC} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase">Descrição</label>
                <Input
                  required
                  placeholder="Ex: Supermercado, Restaurante..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase">Categoria</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-border bg-card px-3 py-1 text-xs text-foreground focus-visible:outline-none cursor-pointer"
                >
                  <option value="">Nenhuma</option>
                  {categories
                    .filter(cat => cat.type === 'expense')
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase">Valor Total (R$)</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={formTotalAmount}
                    onChange={(e) => setFormTotalAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#6366f1] font-semibold uppercase">Minha Parte (R$)</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0.00"
                    placeholder="0,00"
                    value={formMyShareAmount}
                    onChange={(e) => {
                      setFormMyShareAmount(e.target.value);
                      setAutoDivide(false);
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoDivide}
                    onChange={(e) => setAutoDivide(e.target.checked)}
                    className="rounded bg-card border-border text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
                  />
                  Dividir por 2 automaticamente (50%)
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase">Data da Compra</label>
                <Input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { setIsCreateCCOpen(false); setEditingCC(null); resetForms(); }}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreatingCC || isUpdatingCC}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                >
                  {isCreatingCC || isUpdatingCC ? 'Salvando...' : 'Confirmar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMMODAL: EXCLUIR TRANSAÇÃO */}
      <ConfirmModal
        isOpen={deletingTxId !== null}
        title="Excluir Transação"
        description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita e todas as parcelas associadas serão apagadas permanentemente do banco."
        confirmText={isDeletingTx ? 'Excluindo...' : 'Excluir'}
        cancelText="Cancelar"
        onConfirm={handleDeleteTx}
        onClose={() => setDeletingTxId(null)}
        isLoading={isDeletingTx}
      />

      {/* CONFIRMMODAL: EXCLUIR DESPESA CARTÃO */}
      <ConfirmModal
        isOpen={deletingCCId !== null}
        title="Excluir Despesa do Cartão"
        description="Deseja mesmo excluir esta despesa do cartão? A transação correspondente lançada na tabela principal NÃO será excluída automaticamente."
        confirmText={isDeletingCC ? 'Excluindo...' : 'Excluir'}
        cancelText="Cancelar"
        onConfirm={handleDeleteCC}
        onClose={() => setDeletingCCId(null)}
        isLoading={isDeletingCC}
      />
    </AppShell>
  );
}
