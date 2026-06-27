import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
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

export const Route = createFileRoute('/')({
  component: LoginComponent,
});

const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email('Formato de e-mail inválido')),
  password: v.pipe(v.string(), v.minLength(8, 'A senha deve conter no mínimo 8 caracteres')),
});

type LoginFormValues = v.InferInput<typeof LoginSchema>;

function LoginComponent() {
  const auth = useAuth();
  
  // Estados de Login
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Estados Interativos do Dashboard (Mockados de acordo com pogZh.png)
  const [tasks, setTasks] = React.useState([
    { id: 1, text: 'Revisar orçamento do mês', completed: true },
    { id: 2, text: 'Ir à academia às 18h', completed: false },
    { id: 3, text: 'Comprar suprimentos para o jantar', completed: false },
    { id: 4, text: 'Responder e-mails de trabalho', completed: true },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const pendingTasksCount = tasks.filter(t => !t.completed).length;

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
              Hoje é segunda-feira, 22 de junho de 2026.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* CARDS GRID: Linha de Cards Superiores */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-7 md:mt-9">
            
            {/* Card 1: Saldo Atual */}
            <div className="p-5 rounded-xl border border-border bg-card/65 flex flex-col justify-between">
              <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase font-mono tracking-wider">
                Saldo Atual
              </span>
              <div className="mt-3">
                <span className="text-2xl md:text-3xl font-extrabold font-mono text-foreground">
                  R$ 12.450,80
                </span>
                <span className="block text-xs md:text-sm font-bold text-emerald-400 font-mono mt-1.5">
                  +4.2% em relação a ontem
                </span>
              </div>
            </div>

            {/* Card 2: Balanço do Mês */}
            <div className="p-5 rounded-xl border border-border bg-card/65 flex flex-col justify-between">
              <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase font-mono tracking-wider">
                Balanço do Mês
              </span>
              <div className="mt-3">
                <span className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400">
                  +R$ 4.700,00
                </span>
                <span className="block text-xs md:text-sm font-semibold text-muted-foreground font-mono mt-1.5">
                  Entradas: R$ 8.900 | Saídas: R$ 4.200
                </span>
              </div>
            </div>

            {/* Card 3: Últimas Transações */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-1 p-5 rounded-xl border border-border bg-card/65 flex flex-col justify-between">
              <span className="text-xs md:text-sm font-bold text-muted-foreground uppercase font-mono tracking-wider">
                Últimas Transações
              </span>
              <div className="mt-3.5 space-y-2.5 font-mono">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-muted-foreground">Mercado</span>
                  <span className="font-bold text-rose-400">-R$ 250,00</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-muted-foreground">Rendimento</span>
                  <span className="font-bold text-emerald-400">+R$ 45,00</span>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* MAIN GRID: Widgets de Tarefas e Compromissos */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-10">
            
            {/* Coluna 1: Organização de Hoje */}
            <div className="p-6 rounded-xl border border-border bg-card/65 flex flex-col">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <h3 className="text-base font-bold tracking-tight text-foreground font-mono">
                  Organização de Hoje
                </h3>
                <span className="text-xs font-semibold text-muted-foreground font-mono">
                  {pendingTasksCount}/{tasks.length} pendentes
                </span>
              </div>

              {/* Lista de Hábitos/Tarefas interativa */}
              <div className="mt-5 space-y-3.5 flex-1">
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => toggleTask(task.id)}
                    className="flex items-start gap-3.5 p-4 rounded-lg border border-border/40 bg-card/30 hover:bg-card-hover/40 transition-smooth cursor-pointer"
                  >
                    <div className="shrink-0 mt-0.5 text-primary">
                      {task.completed ? (
                        <CheckSquare className="h-5 w-5 fill-primary/10" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground/60" />
                      )}
                    </div>
                    <span className={`text-sm font-semibold font-mono transition-smooth ${task.completed ? 'text-muted-foreground line-through decoration-muted-foreground/45' : 'text-foreground'}`}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna 2: Próximos Compromissos */}
            <div className="p-6 rounded-xl border border-border bg-card/65 flex flex-col">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <h3 className="text-base font-bold tracking-tight text-foreground font-mono">
                  Próximos Compromissos
                </h3>
                <button className="text-xs text-primary hover:underline font-mono font-bold cursor-not-allowed">
                  Ver agenda cheia
                </button>
              </div>

              {/* Linha do Tempo/Timeline de compromissos */}
              <div className="mt-6 pl-4 border-l border-border relative space-y-7 ml-3 flex-1">
                
                {/* Compromisso 1 */}
                <div className="relative">
                  {/* Ponto indicador da timeline */}
                  <div className="absolute -left-5.5 top-1.5 h-3.5 w-3.5 rounded-full bg-primary border-4 border-card" />
                  
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center shrink-0 min-w-[55px] font-mono text-xs font-semibold bg-muted/65 border border-border/50 px-2 py-1.5 rounded-md text-muted-foreground">
                      <span className="font-bold text-foreground">10:00</span>
                      <span className="text-[11px] md:text-xs mt-0.5 font-medium">60 min</span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-foreground truncate">
                        Reunião de Alinhamento
                      </span>
                      <span className="block text-xs md:text-sm text-muted-foreground font-mono font-medium mt-1 leading-relaxed">
                        Sincronização semanal do time de design
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compromisso 2 */}
                <div className="relative">
                  {/* Ponto indicador da timeline */}
                  <div className="absolute -left-5.5 top-1.5 h-3.5 w-3.5 rounded-full bg-primary border-4 border-card" />
                  
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center shrink-0 min-w-[55px] font-mono text-xs font-semibold bg-muted/65 border border-border/50 px-2 py-1.5 rounded-md text-muted-foreground">
                      <span className="font-bold text-foreground">14:30</span>
                      <span className="text-[11px] md:text-xs mt-0.5 font-medium">90 min</span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-foreground truncate">
                        Consulta Médica
                      </span>
                      <span className="block text-xs md:text-sm text-muted-foreground font-mono font-medium mt-1 leading-relaxed">
                        Exames de rotina cardiológica
                      </span>
                    </div>
                  </div>
                </div>

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
