import * as React from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  Lock, 
  Key, 
  Code, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Trash2, 
  Edit, 
  ChevronLeft,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { AppShell } from '@layouts/AppShell';
import { ConfirmModal } from '@ui/ConfirmModal';
import { 
  useGetCofreEntries, 
  useGetCofreEntriesId, 
  usePostCofreEntries, 
  usePutCofreEntriesId, 
  useDeleteCofreEntriesId,
  usePostCofreUnlock,
  usePostCofreLock,
  getCofreEntriesQueryKey,
  getCofreEntriesIdQueryKey
} from '@core/api/gen/hooks';
import { postCofreLock } from '@core/api/gen/clients/postCofreLock';

export const Route = createFileRoute('/cofre')({
  beforeLoad: ({ context }) => {
    // Redireciona para o login se o usuário geral não estiver autenticado
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/',
      });
    }
  },
  component: CofreComponent,
  onLeave: ({ context }) => {
    // Bloqueia o cofre automaticamente ao sair da rota (sem usar useEffect)
    postCofreLock().catch(() => {});
    context.queryClient.setQueryData(['cofre', 'status'], 'locked');
    context.queryClient.setQueryData(getCofreEntriesQueryKey(), null);
    context.queryClient.invalidateQueries({ queryKey: getCofreEntriesQueryKey() });
  }
});

function CofreComponent() {
  const queryClient = useQueryClient();
  const isCofreUnlocked = queryClient.getQueryData(['cofre', 'status']) === 'unlocked';
  
  // Estado do Filtro e Busca
  const [activeCategory, setActiveCategory] = React.useState<'all' | 'credential' | 'secure_note' | 'api_key'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Estado de Seleção e Ações
  const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  // Estados do Formulário de Criação/Edição
  const [formCategory, setFormCategory] = React.useState<'credential' | 'secure_note' | 'api_key'>('credential');
  const [formTitle, setFormTitle] = React.useState('');
  const [formUrl, setFormUrl] = React.useState('');
  const [formUsername, setFormUsername] = React.useState('');
  const [formPassword, setFormPassword] = React.useState('');
  const [formContent, setFormContent] = React.useState('');
  const [formProvider, setFormProvider] = React.useState('');
  const [formToken, setFormToken] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = React.useState(false);

  // Estados do PIN de Desbloqueio
  const [pin, setPin] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = React.useState(false);
  
  // Estado de revelação de dados sensíveis e cópia
  const [showSensitive, setShowSensitive] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Queries e Mutações do TanStack Query
  const { data: entriesData, isLoading, isError, isFetching } = useGetCofreEntries({
    category: activeCategory !== 'all' ? activeCategory : undefined,
    search: searchQuery || undefined
  }, {
    query: {
      enabled: isCofreUnlocked,
      retry: false,
      staleTime: 0, // Garante que sempre trará dados frescos ao invalidar
      placeholderData: keepPreviousData,
    }
  });

  const { data: detailData, isFetching: isFetchingDetail } = useGetCofreEntriesId(selectedId, {
    query: {
      enabled: !!selectedId,
      retry: false,
    }
  });

  const unlockMutation = usePostCofreUnlock();
  const lockMutation = usePostCofreLock();
  const createMutation = usePostCofreEntries();
  const updateMutation = usePutCofreEntriesId();
  const deleteMutation = useDeleteCofreEntriesId();

  // Executa o desbloqueio enviando o PIN de 6 dígitos
  const handleUnlock = async (pinValue: string) => {
    setIsUnlocking(true);
    setErrorMsg(null);
    try {
      await unlockMutation.mutateAsync({ data: { pin: pinValue } });
      queryClient.setQueryData(['cofre', 'status'], 'unlocked');
      queryClient.invalidateQueries({ queryKey: getCofreEntriesQueryKey() });
      setPin('');
    } catch (err: any) {
      setPin('');
      if (err && typeof err === 'object' && 'status' in err) {
        if (err.status === 423) {
          setErrorMsg('Cofre bloqueado temporariamente. Aguarde 30s.');
        } else if (err.status === 401) {
          setErrorMsg('PIN inválido.');
        } else {
          setErrorMsg(err.data?.message || 'Erro ao desbloquear.');
        }
      } else {
        setErrorMsg('Erro de conexão ao desbloquear.');
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePinUpdate = (digit: string) => {
    if (pin.length < 6 && !isUnlocking) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 6) {
        handleUnlock(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !isUnlocking) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleLock = async () => {
    try {
      await lockMutation.mutateAsync();
    } catch (err) {
      // ignore
    } finally {
      setSelectedId(undefined);
      setIsCreating(false);
      setIsEditing(false);
      queryClient.setQueryData(['cofre', 'status'], 'locked');
      queryClient.setQueryData(getCofreEntriesQueryKey(), null);
      queryClient.invalidateQueries({ queryKey: getCofreEntriesQueryKey() });
    }
  };

  const triggerCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado para a área de transferência');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Prepara o formulário para criação
  const handleOpenCreate = () => {
    setFormCategory('credential');
    setFormTitle('');
    setFormUrl('');
    setFormUsername('');
    setFormPassword('');
    setFormContent('');
    setFormProvider('');
    setFormToken('');
    setFormError(null);
    setIsCreating(true);
    setIsEditing(false);
  };

  // Prepara o formulário para edição com os dados atuais
  const handleOpenEdit = () => {
    if (!detailData?.entry) return;
    const entry = detailData.entry;
    setFormCategory(entry.category);
    setFormTitle(entry.title);
    setFormUrl(entry.url || '');
    setFormUsername(entry.username || '');
    setFormPassword(entry.password || '');
    setFormContent(entry.content || '');
    setFormProvider(entry.provider || '');
    setFormToken(entry.token || '');
    setFormError(null);
    setIsEditing(true);
    setIsCreating(false);
  };

  // Ação de Criar/Editar Entrada
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formTitle.trim()) {
      setFormError('O título é obrigatório.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: any = {
        category: formCategory,
        title: formTitle,
        url: formCategory === 'credential' ? formUrl || null : null,
        username: formCategory === 'credential' ? formUsername || null : null,
        password: formCategory === 'credential' ? formPassword || null : null,
        content: formCategory === 'secure_note' ? formContent || null : null,
        provider: formCategory === 'api_key' ? formProvider || null : null,
        token: formCategory === 'api_key' ? formToken || null : null,
      };

      if (isEditing && selectedId) {
        await updateMutation.mutateAsync({ id: selectedId, data: payload });
        queryClient.invalidateQueries({ queryKey: getCofreEntriesIdQueryKey(selectedId) });
      } else {
        await createMutation.mutateAsync({ data: payload });
      }

      queryClient.invalidateQueries({ queryKey: getCofreEntriesQueryKey() });
      setIsCreating(false);
      setIsEditing(false);
      toast.success('Entrada salva com sucesso!');
    } catch (err: any) {
      setFormError(err.data?.message || 'Erro ao salvar dados no cofre.');
      toast.error('Erro ao salvar dados no cofre.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  // Ação de Excluir Entrada
  const handleDeleteEntry = () => {
    if (!selectedId) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteEntry = async () => {
    if (!selectedId) return;
    
    try {
      await deleteMutation.mutateAsync({ id: selectedId });
      queryClient.invalidateQueries({ queryKey: getCofreEntriesQueryKey() });
      setSelectedId(undefined);
      setIsDeleteModalOpen(false);
      toast.success('Entrada excluída com sucesso!');
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao deletar entrada.');
    }
  };

  // Determina se o cofre está bloqueado
  // O backend retorna erro 401 ou 403 se o cofre_token estiver ausente/expirado
  const isCofreLocked = !isCofreUnlocked || isError;

  // Estado de Carregamento Inicial
  if (isLoading && !entriesData && !isCofreLocked) {
    return (
      <AppShell activeTab="cofre">
        <div className="flex-1 flex flex-col items-center justify-center bg-[#09090b] min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary" />
          <p className="mt-4 text-xs font-semibold font-mono text-muted-foreground animate-pulse">
            Carregando Cofre...
          </p>
        </div>
      </AppShell>
    );
  }

  // =========================================================================
  // VIEW: ESTADO BLOQUEADO (PIN Screen)
  // =========================================================================
  if (isCofreLocked) {
    return (
      <AppShell activeTab="cofre">
        <div className="flex-1 flex items-center justify-center bg-[#09090b] p-6 min-h-screen">
          
          <div className="w-full max-w-[320px] bg-[#18181b] border border-[#27272a] rounded-xl p-8 shadow-xl text-center space-y-6">
            
            {/* Header */}
            <div className="space-y-3">
              <div className="flex h-12 w-12 rounded-xl bg-primary/10 items-center justify-center text-primary mx-auto">
                <Lock className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold font-mono text-[#fafafa]">
                  Cofre Bloqueado
                </h2>
                <p className="text-xs text-[#a1a1aa] font-mono font-semibold">
                  Insira seu PIN de segurança
                </p>
              </div>
            </div>

            {/* Dots Indicadores do PIN */}
            <div className="space-y-3">
              <div className="flex justify-center gap-3.5 my-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-full border transition-all duration-200 ${
                      i < pin.length
                        ? 'bg-primary border-primary scale-110 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                        : 'bg-transparent border-[#27272a]'
                    }`}
                  />
                ))}
              </div>

              {/* Mensagem de Erro (Lockout/Incorreto) */}
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-mono font-semibold flex items-center gap-2 justify-center">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Teclado Numérico */}
            <div className="grid grid-cols-3 gap-3.5 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinUpdate(digit)}
                  disabled={isUnlocking}
                  className="flex items-center justify-center h-12.5 w-12.5 rounded-full border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-base font-bold font-mono text-[#fafafa] transition-smooth cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {digit}
                </button>
              ))}
              <div /> {/* Espaço vazio */}
              <button
                onClick={() => handlePinUpdate('0')}
                disabled={isUnlocking}
                className="flex items-center justify-center h-12.5 w-12.5 rounded-full border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-base font-bold font-mono text-[#fafafa] transition-smooth cursor-pointer active:scale-95 disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                disabled={isUnlocking || pin.length === 0}
                className="flex items-center justify-center h-12.5 w-12.5 rounded-full border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] text-base font-bold font-mono text-[#fafafa] transition-smooth cursor-pointer active:scale-95 disabled:opacity-50"
                title="Apagar dígito"
              >
                ⌫
              </button>
            </div>

            {isUnlocking && (
              <p className="text-[10px] text-primary font-mono font-bold animate-pulse mt-2">
                Verificando PIN...
              </p>
            )}

          </div>

        </div>
      </AppShell>
    );
  }

  // =========================================================================
  // VIEW: ESTADO DESBLOQUEADO (Lista + Detalhe)
  // =========================================================================
  const entries = entriesData?.entries || [];

  return (
    <AppShell activeTab="cofre">
      <div className="flex-1 flex bg-[#09090b] relative overflow-hidden h-full">
        
        {/* COLUNA 1 (Categorias): Apenas visível no Desktop lg (Pencil desktop cofre) */}
        <aside className="hidden lg:flex flex-col w-[220px] border-r border-[#27272a] bg-[#18181b]/50 p-4 space-y-6 shrink-0 h-full">
          <div className="space-y-1">
            <h4 className="text-xs md:text-sm font-bold text-[#a1a1aa] uppercase tracking-wider font-mono px-3">
              Categorias
            </h4>
            <nav className="space-y-1">
              <button
                onClick={() => { setActiveCategory('all'); setSelectedId(undefined); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs md:text-sm font-mono font-bold transition-smooth text-left cursor-pointer ${
                  activeCategory === 'all' ? 'bg-[#27272a] text-[#fafafa]' : 'text-[#a1a1aa] hover:text-[#fafafa]'
                }`}
              >
                <span>Todos</span>
              </button>
              <button
                onClick={() => { setActiveCategory('credential'); setSelectedId(undefined); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-mono font-bold transition-smooth text-left cursor-pointer ${
                  activeCategory === 'credential' ? 'bg-[#27272a] text-[#fafafa]' : 'text-[#a1a1aa] hover:text-[#fafafa]'
                }`}
              >
                <Key className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Credenciais</span>
              </button>
              <button
                onClick={() => { setActiveCategory('secure_note'); setSelectedId(undefined); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-mono font-bold transition-smooth text-left cursor-pointer ${
                  activeCategory === 'secure_note' ? 'bg-[#27272a] text-[#fafafa]' : 'text-[#a1a1aa] hover:text-[#fafafa]'
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-[#22c55e] shrink-0" />
                <span>Notas Seguras</span>
              </button>
              <button
                onClick={() => { setActiveCategory('api_key'); setSelectedId(undefined); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-mono font-bold transition-smooth text-left cursor-pointer ${
                  activeCategory === 'api_key' ? 'bg-[#27272a] text-[#fafafa]' : 'text-[#a1a1aa] hover:text-[#fafafa]'
                }`}
              >
                <Code className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Chaves de API</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-[#27272a] mt-auto">
            <Button
              onClick={handleLock}
              className="w-full h-9 font-bold bg-[#f43f5e] hover:bg-[#f43f5e]/90 text-white rounded-md transition-smooth font-mono text-xs md:text-sm cursor-pointer"
            >
              Bloquear Cofre
            </Button>
          </div>
        </aside>

        {/* COLUNA 2 (Lista de Itens): Visível no mobile (se nada selecionado), tablet e desktop */}
        <section className={`flex flex-col border-r border-[#27272a] bg-[#09090b] w-full md:w-[260px] lg:w-[320px] shrink-0 h-full ${
          (selectedId || isCreating) ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Header da lista */}
          <div className="p-4 border-b border-[#27272a] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-[#fafafa] m-0">
                  Cofre
                </h2>
                <span className="text-[10px] bg-[#27272a] text-[#a1a1aa] px-1.5 py-0.5 rounded font-mono font-bold">
                  {entries.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Botão de criar novo */}
                <button
                  onClick={handleOpenCreate}
                  className="p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white transition-smooth cursor-pointer"
                  title="Criar nova entrada"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {/* Botão Lock no Mobile/Tablet */}
                <button
                  onClick={handleLock}
                  className="lg:hidden p-1.5 rounded-lg border border-[#27272a] bg-[#18181b] hover:bg-card-hover text-[#f43f5e] transition-smooth cursor-pointer"
                  title="Bloquear cofre"
                >
                  <Lock className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Barra de Pesquisa */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#a1a1aa]" />
              <Input
                placeholder="Buscar no cofre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 border-[#27272a] bg-[#18181b]/50 text-xs font-mono font-semibold"
              />
            </div>

            {/* Abas horizontais no Mobile/Tablet (para filtrar já que a Coluna 1 não aparece) */}
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => { setActiveCategory('all'); setSelectedId(undefined); }}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold shrink-0 transition-smooth cursor-pointer ${
                  activeCategory === 'all' ? 'bg-[#27272a] text-[#fafafa]' : 'bg-[#18181b]/40 text-[#a1a1aa] hover:text-[#fafafa]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => { setActiveCategory('credential'); setSelectedId(undefined); }}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold shrink-0 flex items-center gap-1.5 transition-smooth cursor-pointer ${
                  activeCategory === 'credential' ? 'bg-[#27272a] text-[#fafafa]' : 'bg-[#18181b]/40 text-[#a1a1aa] hover:text-[#fafafa]'
                }`}
              >
                <Key className="h-3 w-3 text-primary" />
                <span>Credenciais</span>
              </button>
              <button
                onClick={() => { setActiveCategory('secure_note'); setSelectedId(undefined); }}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold shrink-0 flex items-center gap-1.5 transition-smooth cursor-pointer ${
                  activeCategory === 'secure_note' ? 'bg-[#27272a] text-[#fafafa]' : 'bg-[#18181b]/40 text-[#a1a1aa] hover:text-[#fafafa]'
                }`}
              >
                <FileText className="h-3 w-3 text-[#22c55e]" />
                <span>Notas</span>
              </button>
              <button
                onClick={() => { setActiveCategory('api_key'); setSelectedId(undefined); }}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold shrink-0 flex items-center gap-1.5 transition-smooth cursor-pointer ${
                  activeCategory === 'api_key' ? 'bg-[#27272a] text-[#fafafa]' : 'bg-[#18181b]/40 text-[#a1a1aa] hover:text-[#fafafa]'
                }`}
              >
                <Code className="h-3 w-3 text-amber-400" />
                <span>Chaves</span>
              </button>
            </div>
          </div>

          {/* Listagem de itens */}
          <div className={`flex-1 overflow-y-auto p-2 space-y-1 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            {entries.length === 0 ? (
              <p className="text-center text-[10px] font-mono font-bold text-[#a1a1aa] mt-8">
                Nenhum item encontrado.
              </p>
            ) : (
              entries.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { setSelectedId(item.id); setIsCreating(false); setIsEditing(false); }}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-smooth ${
                    selectedId === item.id 
                      ? 'bg-primary/10 border border-primary/25 text-[#fafafa]' 
                      : 'hover:bg-[#18181b]/50 border border-transparent text-[#a1a1aa] hover:text-[#fafafa]'
                  }`}
                >
                  <div className="shrink-0 p-1.5 bg-[#18181b] border border-[#27272a] rounded-md">
                    {item.category === 'credential' && <Key className="h-4 w-4 text-primary" />}
                    {item.category === 'secure_note' && <FileText className="h-4 w-4 text-[#22c55e]" />}
                    {item.category === 'api_key' && <Code className="h-4 w-4 text-amber-400" />}
                  </div>
                  <div className="min-w-0 leading-none">
                    <span className="block text-xs md:text-sm font-bold font-mono text-[#fafafa] truncate">
                      {item.title}
                    </span>
                    <span className="block text-[11px] md:text-xs font-mono font-medium text-[#a1a1aa] mt-1.5 truncate">
                      {item.category === 'credential' ? item.username : item.category === 'secure_note' ? 'Nota Segura' : item.provider || 'Chave de API'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* COLUNA 3 (Detalhes / Formulário): Visível no mobile (se algo selecionado ou criando), tablet e desktop */}
        <section className={`flex-1 flex flex-col bg-[#09090b] h-full ${
          (selectedId || isCreating || isEditing) ? 'flex' : 'hidden md:flex'
        }`}>
          
          {/* Mobile Back Header */}
          <div className="md:hidden flex items-center gap-3 p-4 border-b border-[#27272a] bg-[#18181b]/35">
            <button
              onClick={() => { setSelectedId(undefined); setIsCreating(false); setIsEditing(false); }}
              className="p-1 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <span className="text-sm font-bold font-mono text-[#fafafa]">
              {isCreating ? 'Nova Entrada' : isEditing ? 'Editar Entrada' : 'Visualizar'}
            </span>
          </div>

          {/* ========================================================================= */}
          {/* SUB-VIEW 1: FORMULÁRIO DE CRIAÇÃO OU EDIÇÃO */}
          {/* ========================================================================= */}
          {(isCreating || isEditing) ? (
            <form onSubmit={handleSaveEntry} className="flex-1 flex flex-col p-6 overflow-y-auto space-y-5 animate-fade-in">
              
              <div className="border-b border-[#27272a] pb-4">
                <h3 className="text-sm font-bold font-mono text-[#fafafa] m-0">
                  {isCreating ? 'Criar Nova Entrada' : 'Editar Entrada'}
                </h3>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4 max-w-[480px]">
                {/* Título */}
                <div className="space-y-1.5">
                  <label className="text-xs md:text-sm font-bold text-[#a1a1aa] font-mono">Título</label>
                  <Input
                    required
                    placeholder="Ex: GitHub Sofia"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="h-10 border-[#27272a] bg-[#18181b]/50 text-xs md:text-sm font-mono font-semibold"
                  />
                </div>

                {/* Categoria (Apenas no Create) */}
                {isCreating && (
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-bold text-[#a1a1aa] font-mono">Categoria</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-md border border-[#27272a] bg-[#18181b]/80 text-[#fafafa] text-xs md:text-sm font-mono font-semibold focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="credential">Credencial</option>
                      <option value="secure_note">Nota Segura</option>
                      <option value="api_key">Chave de API</option>
                    </select>
                  </div>
                )}

                {/* ==================== CREDENCIAL FIELDS ==================== */}
                {formCategory === 'credential' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-bold text-[#a1a1aa] font-mono">Usuário / E-mail</label>
                      <Input
                        placeholder="Ex: sofia@lifeos.com"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        className="h-10 border-[#27272a] bg-[#18181b]/50 text-xs md:text-sm font-mono font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-bold text-[#a1a1aa] font-mono">Senha</label>
                      <Input
                        type="password"
                        placeholder="Senha secreta"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="h-10 border-[#27272a] bg-[#18181b]/50 text-xs md:text-sm font-mono font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-bold text-[#a1a1aa] font-mono">URL do Site</label>
                      <Input
                        placeholder="Ex: https://github.com"
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                        className="h-10 border-[#27272a] bg-[#18181b]/50 text-xs md:text-sm font-mono font-semibold"
                      />
                    </div>
                  </>
                )}

                {/* ==================== SECURE NOTE FIELDS ==================== */}
                {formCategory === 'secure_note' && (
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-bold text-[#a1a1aa] font-mono">Conteúdo Privado</label>
                    <textarea
                      placeholder="Coloque suas anotações privadas e seguras aqui..."
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      rows={6}
                      className="w-full p-3 rounded-md border border-[#27272a] bg-[#18181b]/50 text-[#fafafa] text-xs md:text-sm font-mono font-semibold focus:outline-none focus:border-primary leading-relaxed"
                    />
                  </div>
                )}

                {/* ==================== API KEY FIELDS ==================== */}
                {formCategory === 'api_key' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-bold text-[#a1a1aa] font-mono">Provedor</label>
                      <Input
                        placeholder="Ex: OpenAI"
                        value={formProvider}
                        onChange={(e) => setFormProvider(e.target.value)}
                        className="h-10 border-[#27272a] bg-[#18181b]/50 text-xs md:text-sm font-mono font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-bold text-[#a1a1aa] font-mono">Token / Secret Key</label>
                      <Input
                        type="password"
                        placeholder="sk-proj-..."
                        value={formToken}
                        onChange={(e) => setFormToken(e.target.value)}
                        className="h-10 border-[#27272a] bg-[#18181b]/50 text-xs md:text-sm font-mono font-semibold"
                      />
                    </div>
                  </>
                )}

              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-3 pt-6 border-t border-[#27272a] max-w-[480px]">
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="h-10 font-bold bg-primary hover:bg-primary/95 text-white px-5 rounded-md font-mono text-xs md:text-sm cursor-pointer"
                >
                  {formSubmitting ? 'Salvando...' : 'Salvar Entrada'}
                </Button>
                <Button
                  type="button"
                  onClick={() => { setIsCreating(false); setIsEditing(false); }}
                  className="h-10 font-bold border border-[#27272a] bg-transparent text-[#a1a1aa] hover:text-[#fafafa] px-5 rounded-md font-mono text-xs md:text-sm cursor-pointer"
                >
                  Cancelar
                </Button>
              </div>

            </form>
          ) : selectedId && isFetchingDetail && !detailData?.entry ? (
            
            // =========================================================================
            // SUB-VIEW 2.5: SKELETON LOADER ENQUANTO CARREGA O DETALHE DO ITEM
            // =========================================================================
            <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 animate-pulse">
              <div className="border-b border-[#27272a] pb-4 space-y-2.5">
                <div className="h-6.5 w-48 bg-[#18181b] border border-[#27272a] rounded" />
                <div className="h-4.5 w-20 bg-[#18181b] border border-[#27272a] rounded-full" />
              </div>
              <div className="space-y-5 max-w-[500px]">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-[#18181b] rounded" />
                  <div className="h-11 w-full bg-[#18181b] border border-[#27272a] rounded-lg" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-[#18181b] rounded" />
                  <div className="h-11 w-full bg-[#18181b] border border-[#27272a] rounded-lg" />
                </div>
              </div>
            </div>
          ) : selectedId && detailData?.entry ? (
            
            // =========================================================================
            // SUB-VIEW 2: VISUALIZAÇÃO DETALHADA DO ITEM
            // =========================================================================
            <div className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-6 animate-fade-in ${isFetchingDetail ? 'opacity-70' : 'opacity-100'} transition-opacity duration-200`}>
              
              {/* Header de Detalhes */}
              <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold font-mono text-[#fafafa] m-0">
                    {detailData.entry.title}
                  </h2>
                  <span className="inline-block text-[9px] font-bold font-mono text-[#a1a1aa] uppercase bg-[#18181b] border border-[#27272a] px-2 py-0.5 rounded-full mt-1.5">
                    {detailData.entry.category === 'credential' && 'Credencial'}
                    {detailData.entry.category === 'secure_note' && 'Nota Segura'}
                    {detailData.entry.category === 'api_key' && 'Chave de API'}
                  </span>
                </div>
                
                {/* Ações */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenEdit}
                    className="p-2 rounded-lg border border-[#27272a] bg-[#18181b] hover:bg-card-hover text-[#fafafa] transition-smooth cursor-pointer"
                    title="Editar entrada"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDeleteEntry}
                    className="p-2 rounded-lg border border-[#27272a] bg-[#18181b] hover:bg-card-hover text-[#f43f5e] transition-smooth cursor-pointer"
                    title="Excluir entrada"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Campos do Detalhe conforme a Categoria */}
              <div className="space-y-5 max-w-[500px]">
                
                {/* 1. CREDENCIAIS */}
                {detailData.entry.category === 'credential' && (
                  <>
                    {/* Usuário */}
                    {detailData.entry.username && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-[#a1a1aa] uppercase font-mono tracking-wider">Usuário</span>
                        <div className="flex items-center justify-between p-3.5 bg-[#18181b]/50 border border-[#27272a] rounded-lg">
                          <span className="text-xs md:text-sm font-semibold font-mono text-[#fafafa] select-text">
                            {detailData.entry.username}
                          </span>
                          <button
                            onClick={() => triggerCopy('username', detailData.entry.username)}
                            className="p-1 rounded text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                            title="Copiar usuário"
                          >
                            {copiedField === 'username' ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Senha */}
                    {detailData.entry.password && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-[#a1a1aa] uppercase font-mono tracking-wider">Senha</span>
                        <div className="flex items-center justify-between p-3.5 bg-[#18181b]/50 border border-[#27272a] rounded-lg">
                          <span className="text-xs md:text-sm font-semibold font-mono text-[#fafafa] select-text">
                            {showSensitive ? detailData.entry.password : '••••••••••••••••'}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setShowSensitive(!showSensitive)}
                              className="p-1 rounded text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                              title={showSensitive ? 'Ocultar senha' : 'Ver senha'}
                            >
                              {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => triggerCopy('password', detailData.entry.password)}
                              className="p-1 rounded text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                              title="Copiar senha"
                            >
                              {copiedField === 'password' ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* URL */}
                    {detailData.entry.url && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-[#a1a1aa] uppercase font-mono tracking-wider">URL do Site</span>
                        <div className="flex items-center justify-between p-3.5 bg-[#18181b]/50 border border-[#27272a] rounded-lg">
                          <span className="text-xs md:text-sm font-semibold font-mono text-[#fafafa] select-text truncate">
                            {detailData.entry.url}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={detailData.entry.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded text-[#a1a1aa] hover:text-primary transition-smooth cursor-pointer"
                              title="Abrir no navegador"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => triggerCopy('url', detailData.entry.url)}
                              className="p-1 rounded text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                              title="Copiar link"
                            >
                              {copiedField === 'url' ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 2. NOTAS SEGURAS */}
                {detailData.entry.category === 'secure_note' && detailData.entry.content && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#a1a1aa] uppercase font-mono tracking-wider">Conteúdo Privado</span>
                      <button
                        onClick={() => triggerCopy('content', detailData.entry.content)}
                        className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                        title="Copiar anotação"
                      >
                        {copiedField === 'content' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#22c55e]" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copiar Tudo</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-4 bg-[#18181b]/50 border border-[#27272a] rounded-lg text-xs md:text-sm font-mono font-medium text-[#fafafa] leading-relaxed select-text whitespace-pre-wrap">
                      {detailData.entry.content}
                    </div>
                  </div>
                )}

                {/* 3. CHAVES DE API */}
                {detailData.entry.category === 'api_key' && (
                  <>
                    {/* Provedor */}
                    {detailData.entry.provider && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-[#a1a1aa] uppercase font-mono tracking-wider">Provedor</span>
                        <div className="flex items-center justify-between p-3.5 bg-[#18181b]/50 border border-[#27272a] rounded-lg">
                          <span className="text-xs md:text-sm font-semibold font-mono text-[#fafafa] select-text">
                            {detailData.entry.provider}
                          </span>
                          <button
                            onClick={() => triggerCopy('provider', detailData.entry.provider)}
                            className="p-1 rounded text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                            title="Copiar provedor"
                          >
                            {copiedField === 'provider' ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Token */}
                    {detailData.entry.token && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-[#a1a1aa] uppercase font-mono tracking-wider">Token / Secret Key</span>
                        <div className="flex items-center justify-between p-3.5 bg-[#18181b]/50 border border-[#27272a] rounded-lg">
                          <span className="text-xs md:text-sm font-semibold font-mono text-[#fafafa] select-text truncate">
                            {showSensitive ? detailData.entry.token : '••••••••••••••••••••••••••••••••'}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setShowSensitive(!showSensitive)}
                              className="p-1 rounded text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                              title={showSensitive ? 'Ocultar token' : 'Ver token'}
                            >
                              {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => triggerCopy('token', detailData.entry.token)}
                              className="p-1 rounded text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                              title="Copiar token"
                            >
                              {copiedField === 'token' ? <Check className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </div>

              {/* Metadados */}
              <div className="pt-6 border-t border-[#27272a] text-[10px] font-mono text-[#a1a1aa] space-y-1 ml-1.5">
                <span className="block">Criado em: {new Date(detailData.entry.createdAt).toLocaleString('pt-BR')}</span>
                <span className="block">Atualizado em: {new Date(detailData.entry.updatedAt).toLocaleString('pt-BR')}</span>
              </div>

            </div>
          ) : (
            
            // =========================================================================
            // SUB-VIEW 3: PLACEHOLDER (Nenhum item selecionado)
            // =========================================================================
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#09090b]/40 animate-fade-in">
              <div className="flex h-14 w-14 rounded-2xl bg-card border border-[#27272a] items-center justify-center text-[#a1a1aa] mb-4">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xs font-bold font-mono text-[#fafafa] uppercase tracking-wider">
                Dados Protegidos
              </h3>
              <p className="text-[10px] text-[#a1a1aa] max-w-[240px] font-mono font-semibold mt-2 leading-relaxed">
                Selecione um item da lista lateral para visualizar suas credenciais descriptografadas.
              </p>
            </div>
          )}

        </section>

      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteEntry}
        title={`Excluir ${
          detailData?.entry?.category === 'credential' ? 'Credencial' :
          detailData?.entry?.category === 'secure_note' ? 'Nota Segura' :
          detailData?.entry?.category === 'api_key' ? 'Chave de API' : 'Entrada'
        }`}
        description={`Tem certeza que deseja excluir esta ${
          detailData?.entry?.category === 'credential' ? 'credencial' :
          detailData?.entry?.category === 'secure_note' ? 'nota segura' :
          detailData?.entry?.category === 'api_key' ? 'chave de API' : 'entrada'
        }? Esta ação não pode ser desfeita.`}
        isLoading={deleteMutation.isPending}
      />
    </AppShell>
  );
}
