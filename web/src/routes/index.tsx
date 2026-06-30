import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import {
  AlertCircle,
  Command,
  Mail,
  Lock,
  CheckSquare,
  Square
} from 'lucide-react';
import * as v from 'valibot';
import { useAuth } from '@core/auth-provider';
import { AppShell } from '@layouts/AppShell';
import {
  useGetFinanceSummary,
  useGetFinanceTransactions,
  useGetTasks,
  usePatchTasksIdMove,
  getTasksQueryKey,
} from '@core/api/gen/hooks';

export const Route = createFileRoute('/')({
  component: LoginComponent,
});

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email('Formato de e-mail inválido')),
  password: v.pipe(v.string(), v.minLength(8, 'A senha deve conter no mínimo 8 caracteres')),
});

type LoginFormValues = v.InferInput<typeof LoginSchema>;

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function LoginComponent() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const isLoggedIn = !!(auth.isAuthenticated && auth.user);

  // Estados de Login
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Data de hoje, formatada por extenso em pt-BR
  const todayLabel = React.useMemo(() => {
    const raw = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `Hoje é ${raw.charAt(0).toUpperCase() + raw.slice(1)}.`;
  }, []);

  // Período do mês atual e do mês anterior, para o saldo e a comparação de tendência
  const { fromDate, toDate, currentMonthParam, previousMonthParam } = React.useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      fromDate: toIsoDate(from),
      toDate: toIsoDate(to),
      currentMonthParam: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      previousMonthParam: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`,
    };
  }, []);

  // Resumo financeiro: mês atual e mês anterior (para a tendência do Saldo Atual)
  const { data: summaryData, isLoading: isLoadingSummary } = useGetFinanceSummary(
    { month: currentMonthParam },
    { query: { enabled: isLoggedIn } },
  );
  const { data: prevSummaryData } = useGetFinanceSummary(
    { month: previousMonthParam },
    { query: { enabled: isLoggedIn } },
  );

  // Últimas transações do mês atual
  const { data: txData, isLoading: isLoadingTx } = useGetFinanceTransactions(
    { from: fromDate, to: toDate },
    { query: { enabled: isLoggedIn } },
  );
  const latestTransactions = React.useMemo(
    () => [...(txData?.transactions ?? [])].reverse().slice(0, 3),
    [txData],
  );

  // Tarefas reais (Organização de Hoje)
  const { data: tasksData, isLoading: isLoadingTasks } = useGetTasks(undefined, {
    query: { enabled: isLoggedIn },
  });
  const allTasks = tasksData?.tasks ?? [];
  const visibleTasks = React.useMemo(
    () =>
      [...allTasks]
        .sort((a, b) => (a.column === 'done' ? 1 : 0) - (b.column === 'done' ? 1 : 0))
        .slice(0, 6),
    [allTasks],
  );
  const pendingTasksCount = allTasks.filter((t) => t.column !== 'done').length;

  const { mutateAsync: moveTask } = usePatchTasksIdMove();

  const toggleTask = async (task: { id: string; column: string }) => {
    const targetColumn = task.column === 'done' ? 'todo' : 'done';
    const siblingsInTarget = allTasks.filter((t) => t.column === targetColumn);
    const maxPos = siblingsInTarget.length > 0 ? Math.max(...siblingsInTarget.map((t) => t.position)) : 0;
    try {
      await moveTask({ id: task.id, data: { column: targetColumn as 'todo' | 'in_progress' | 'done', position: maxPos + 1 } });
      queryClient.invalidateQueries({ queryKey: getTasksQueryKey() });
    } catch {
      toast.error('Erro ao atualizar tarefa.');
    }
  };

  // Saldo do mês: valor e tendência real em relação ao mês anterior
  const balance = summaryData?.balance ?? 0;
  const prevBalance = prevSummaryData?.balance ?? 0;
  const balanceTrend = React.useMemo(() => {
    if (!prevSummaryData) return null;
    if (prevBalance !== 0) {
      const pct = ((balance - prevBalance) / Math.abs(prevBalance)) * 100;
      return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% em relação ao mês anterior`, positive: pct >= 0 };
    }
    if (balance === 0) return { label: 'Igual ao mês anterior', positive: true };
    return {
      label: balance > 0 ? 'Acima do mês anterior' : 'Abaixo do mês anterior',
      positive: balance > 0,
    };
  }, [balance, prevBalance, prevSummaryData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const values = { email, password };
    const result = v.safeParse(LoginSchema, values);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormValues, string>> = {};
      for (const issue of result.issues) {
        const path = issue.path?.[0]?.key as keyof LoginFormValues;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await auth.login(email, password);
    } catch (err: any) {
      if (err && typeof err === 'object' && 'data' in err) {
        setApiError(err.data?.message || 'E-mail ou senha incorretos.');
      } else {
        setApiError(err instanceof Error ? err.message : 'Erro ao realizar login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Se já estiver autenticado, mostra o Dashboard Inicial completo
  if (auth.isAuthenticated && auth.user) {
    return (
      <AppShell activeTab="dashboard">
        
        {/* MAIN PANEL: Conteúdo Principal do Dashboard */}
        <main className="flex-1 flex flex-col p-6 md:p-8 lg:p-10 pb-24 md:pb-8 overflow-y-auto">
          
          {/* Header da Seção */}
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground font-mono">
              Olá, {auth.user.name}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-mono font-semibold">
              {todayLabel}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* CARDS GRID: Linha de Cards Superiores */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-7 md:mt-9">

            {/* Card 1: Saldo Atual (mês corrente) */}
            <div className="p-5 rounded-xl border border-border bg-card/65 flex flex-col justify-between">
              <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase font-mono tracking-wider">
                Saldo Atual
              </span>
              <div className="mt-3">
                <span className="text-2xl md:text-3xl font-extrabold font-mono text-foreground">
                  {isLoadingSummary ? '...' : formatBRL(balance)}
                </span>
                {balanceTrend && (
                  <span className={`block text-xs md:text-sm font-bold font-mono mt-1.5 ${balanceTrend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {balanceTrend.label}
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Balanço do Mês */}
            <div className="p-5 rounded-xl border border-border bg-card/65 flex flex-col justify-between">
              <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase font-mono tracking-wider">
                Balanço do Mês
              </span>
              <div className="mt-3">
                <span className={`text-2xl md:text-3xl font-extrabold font-mono ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isLoadingSummary ? '...' : `${balance >= 0 ? '+' : ''}${formatBRL(balance)}`}
                </span>
                <span className="block text-xs md:text-sm font-semibold text-muted-foreground font-mono mt-1.5">
                  Entradas: {formatBRL(summaryData?.income ?? 0)} | Saídas: {formatBRL(summaryData?.expenses ?? 0)}
                </span>
              </div>
            </div>

            {/* Card 3: Últimas Transações */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1 p-5 rounded-xl border border-border bg-card/65 flex flex-col justify-between">
              <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase font-mono tracking-wider">
                Últimas Transações
              </span>
              <div className="mt-3.5 space-y-2.5 font-mono">
                {isLoadingTx ? (
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                ) : latestTransactions.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Nenhuma transação este mês.</span>
                ) : (
                  latestTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-sm font-semibold">
                      <span className="text-muted-foreground truncate max-w-[60%]">{tx.description}</span>
                      <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.totalAmount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* MAIN GRID: Widgets de Tarefas (Compromissos foram movidos para Google Calendar) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 gap-6 md:gap-8 mt-8 md:mt-10">

            {/* Coluna 1: Organização de Hoje */}
            <div className="p-6 rounded-xl border border-border bg-card/65 flex flex-col">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <h3 className="text-base font-bold tracking-tight text-foreground font-mono">
                  Organização de Hoje
                </h3>
                <span className="text-xs font-semibold text-muted-foreground font-mono">
                  {pendingTasksCount}/{allTasks.length} pendentes
                </span>
              </div>

              {/* Lista de Tarefas interativa (dados reais) */}
              <div className="mt-5 space-y-3.5 flex-1">
                {isLoadingTasks ? (
                  <span className="text-sm text-muted-foreground font-mono">Carregando...</span>
                ) : visibleTasks.length === 0 ? (
                  <span className="text-sm text-muted-foreground font-mono">
                    Nenhuma tarefa cadastrada. Crie tarefas na aba Organização.
                  </span>
                ) : (
                  visibleTasks.map((task) => {
                    const completed = task.column === 'done';
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task)}
                        className="flex items-start gap-3.5 p-4 rounded-lg border border-border/40 bg-card/30 hover:bg-card-hover/40 transition-smooth cursor-pointer"
                      >
                        <div className="shrink-0 mt-0.5 text-primary">
                          {completed ? (
                            <CheckSquare className="h-5 w-5 fill-primary/10" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground/60" />
                          )}
                        </div>
                        <span className={`text-sm font-semibold font-mono transition-smooth ${completed ? 'text-muted-foreground line-through decoration-muted-foreground/45' : 'text-foreground'}`}>
                          {task.title}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </main>
      </AppShell>
    );
  }

  // Renderiza a Tela de Login (Fiel ao design do Pencil Fvjfv.png)
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background select-none overflow-x-hidden">
      
      {/* Coluna Esquerda: Banner Column (width: 600px no desktop) */}
      <div className="hidden lg:flex flex-col justify-between w-[600px] bg-card border-r border-border p-12 shrink-0">
        {/* Logo Acme Inc */}
        <div className="flex items-center gap-2">
          <Command className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground tracking-tight font-mono">
            Acme Inc
          </span>
        </div>

        {/* Depoimento/Quote */}
        <div className="space-y-4">
          <p className="text-xl font-medium leading-relaxed text-foreground font-mono">
            "Eu sou sensível as consequências do meu comportamento"
          </p>
        </div>

        {/* Footer info dummy */}
        <div className="text-xs text-muted-foreground font-mono font-medium">
          &copy; 2026 Acme Inc. Todos os direitos reservados.
        </div>
      </div>

      {/* Coluna Direita: Login Column */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-[360px] space-y-7">
          
          {/* Header com Logo */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-12 w-12 rounded-xl bg-primary/10 items-center justify-center text-primary">
              <Command className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-foreground m-0 font-mono">
                Criar uma conta
              </h2>
              <p className="text-xs text-muted-foreground font-mono font-medium">
                Insira seu e-mail abaixo para acessar seu painel
              </p>
            </div>
          </div>

          {apiError && (
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span className="font-mono font-semibold">{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground font-mono" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-border bg-card font-mono text-sm font-semibold"
                  disabled={isLoading}
                  required
                />
              </div>
              {errors.email && (
                <span className="text-xs font-semibold text-destructive flex items-center gap-1 mt-1 font-mono">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </span>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground font-mono" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 border-border bg-card font-mono text-sm font-semibold"
                  disabled={isLoading}
                  required
                />
              </div>
              {errors.password && (
                <span className="text-xs font-semibold text-destructive flex items-center gap-1 mt-1 font-mono">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </span>
              )}
            </div>

            {/* Botão Login - Ajustado para apenas "Entrar" com fonte encorpada */}
            <Button
              type="submit"
              className="w-full h-11 mt-6 font-bold bg-primary hover:bg-primary/95 text-white rounded-md transition-smooth cursor-pointer font-mono text-sm"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Termos de Serviço */}
          <p className="text-center text-[11px] md:text-xs leading-normal text-muted-foreground px-4 font-mono font-medium">
            Ao clicar em continuar, você concorda com nossos{' '}
            <a href="#" className="underline hover:text-foreground">Termos de Serviço</a>{' '}
            e{' '}
            <a href="#" className="underline hover:text-foreground">Política de Privacidade</a>.
          </p>

        </div>
      </div>

    </div>
  );
}
