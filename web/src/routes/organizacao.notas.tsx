import * as React from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Trash2, 
  ChevronLeft, 
  FileText, 
  AlertCircle, 
  Loader2,
  ClipboardList,
  GraduationCap,
  CalendarDays
} from 'lucide-react';
import { AppShell } from '@layouts/AppShell';
import { 
  useGetNotes, 
  useGetNotesId, 
  usePostNotes, 
  usePutNotesId, 
  useDeleteNotesId,
  getNotesQueryKey,
  getNotesIdQueryKey
} from '@core/api/gen/hooks';

export const Route = createFileRoute('/organizacao/notas')({
  beforeLoad: ({ context }) => {
    // Redireciona para o login se o usuário geral não estiver autenticado
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/',
      });
    }
  },
  component: NotesComponent,
});

type SaveStatus = 'saved' | 'typing' | 'saving' | 'error';
type OrganizaçãoTab = 'notas' | 'tarefas' | 'estudos' | 'habitos';

function NotesComponent() {
  const queryClient = useQueryClient();
  
  // Estado das Abas do Módulo de Organização (Notas, Tarefas, Estudos, Hábitos)
  const [activeTab, setActiveTab] = React.useState<OrganizaçãoTab>('notas');

  // Estado de seleção e busca
  const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Estado local do editor para evitar input-lag e cursor jumps
  const [editorNoteId, setEditorNoteId] = React.useState<string | null>(null);
  const [editorTitle, setEditorTitle] = React.useState('');
  const [editorContent, setEditorContent] = React.useState('');
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('saved');

  // Refs para controlar o temporizador do debounce e as alterações pendentes
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChangesRef = React.useRef<{ title?: string; content?: string } | null>(null);
  
  // Referências para inputs para aplicar foco na criação
  const titleInputRef = React.useRef<HTMLInputElement | null>(null);

  // Queries e Mutações do TanStack Query
  const { data: listData, isFetching: isFetchingList } = useGetNotes({
    search: searchQuery || undefined
  }, {
    query: {
      enabled: activeTab === 'notas',
      retry: false,
      staleTime: 0,
    }
  });

  const { data: detailData, isFetching: isFetchingDetail } = useGetNotesId(selectedId, {
    query: {
      enabled: activeTab === 'notas' && !!selectedId,
      retry: false,
    }
  });

  const createMutation = usePostNotes();
  const updateMutation = usePutNotesId();
  const deleteMutation = useDeleteNotesId();

  // Sincroniza o estado local do editor quando a nota selecionada é alterada
  if (detailData?.note && detailData.note.id !== editorNoteId) {
    setEditorNoteId(detailData.note.id);
    setEditorTitle(detailData.note.title);
    setEditorContent(detailData.note.content || '');
    setSaveStatus('saved');
    pendingChangesRef.current = null;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }

  // Executa o salvamento no backend (PUT /notes/:id)
  const triggerSave = React.useCallback(async () => {
    if (!selectedId || !pendingChangesRef.current) return;
    
    // Salva as mudanças que serão enviadas e limpa o ref de pendências antes da chamada assíncrona
    const payload = { ...pendingChangesRef.current! };
    pendingChangesRef.current = null;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    setSaveStatus('saving');
    try {
      await updateMutation.mutateAsync({
        id: selectedId,
        data: payload
      });
      setSaveStatus('saved');
      // Invalida as consultas no React Query para manter a lista sincronizada com os snippets novos
      queryClient.invalidateQueries({ queryKey: getNotesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getNotesIdQueryKey(selectedId) });
    } catch (err) {
      // Re-armazena as pendências que falharam para tentar salvar de novo se necessário
      pendingChangesRef.current = { ...payload, ...(pendingChangesRef.current || {}) };
      setSaveStatus('error');
    }
  }, [selectedId, updateMutation, queryClient]);

  // Agenda o auto-save via debounce de 1s
  const scheduleSave = React.useCallback((updatedFields: { title?: string; content?: string }) => {
    pendingChangesRef.current = {
      ...(pendingChangesRef.current || {}),
      ...updatedFields
    };
    
    setSaveStatus('typing');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      triggerSave();
    }, 1000);
  }, [triggerSave]);

  // Lida com a mudança de título no editor
  const handleTitleChange = (newTitle: string) => {
    setEditorTitle(newTitle);
    scheduleSave({ title: newTitle });
  };

  // Lida com a mudança de conteúdo no editor
  const handleContentChange = (newContent: string) => {
    setEditorContent(newContent);
    scheduleSave({ content: newContent });
  };

  // Lida com o evento Blur nos campos (salva imediatamente)
  const handleBlur = () => {
    if (pendingChangesRef.current) {
      triggerSave();
    }
  };

  // Criação instantânea de nova nota
  const handleCreateNote = async () => {
    try {
      const response = await createMutation.mutateAsync({
        data: { title: 'Nova Nota' }
      });
      
      const newNote = response.note;
      
      // Invalida a lista para buscar a nova nota imediatamente
      await queryClient.invalidateQueries({ queryKey: getNotesQueryKey() });
      
      // Seleciona a nota recém-criada
      setSelectedId(newNote.id);
      setEditorNoteId(newNote.id);
      setEditorTitle(newNote.title);
      setEditorContent('');
      setSaveStatus('saved');
      pendingChangesRef.current = null;
      
      // Foca no input do título após o render
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 50);
      
    } catch (err) {
      alert('Erro ao criar nota no servidor.');
    }
  };

  // Exclusão de nota ativa
  const handleDeleteNote = async () => {
    if (!selectedId) return;
    if (!confirm('Deseja realmente excluir esta nota?')) return;
    
    // Cancela qualquer salvamento pendente antes de deletar
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingChangesRef.current = null;
    
    try {
      await deleteMutation.mutateAsync({ id: selectedId });
      queryClient.invalidateQueries({ queryKey: getNotesQueryKey() });
      setSelectedId(undefined);
      setEditorNoteId(null);
    } catch (err) {
      alert('Erro ao deletar nota.');
    }
  };

  const notes = listData?.notes || [];

  return (
    <AppShell activeTab="organizacao">
      <div className="flex-1 flex flex-col bg-[#09090b] p-4 md:p-6 lg:p-10 gap-4 md:gap-5 lg:gap-6 overflow-hidden h-full">
        
        {/* ========================================================================= */}
        {/* HEADER DO MÓDULO DE ORGANIZAÇÃO (Fiel ao design do Pencil) */}
        {/* ========================================================================= */}
        <div className="space-y-1.5 shrink-0 select-none">
          <h1 className="text-2xl md:text-3xl font-bold text-[#fafafa] tracking-tight m-0">
            Organização
          </h1>
          <p className="text-xs md:text-sm text-[#a1a1aa] font-normal m-0">
            Gerencie suas notas, tarefas e hábitos diários
          </p>
        </div>

        {/* ========================================================================= */}
        {/* ABAS DE ORGANIZAÇÃO (Card agrupador - Fiel ao design do Pencil) */}
        {/* ========================================================================= */}
        <div className="bg-[#18181b] border border-[#27272a] p-1 rounded-lg flex items-center gap-1 w-fit shrink-0 overflow-x-auto scrollbar-none select-none">
          <button
            onClick={() => setActiveTab('notas')}
            className={`px-4 py-2 rounded-md text-[13px] transition-smooth cursor-pointer ${
              activeTab === 'notas' 
                ? 'bg-[#09090b] border border-[#27272a] text-[#fafafa] font-medium shadow-sm' 
                : 'bg-transparent border border-transparent text-[#a1a1aa] hover:text-[#fafafa] font-normal'
            }`}
          >
            Notas
          </button>
          <button
            onClick={() => setActiveTab('tarefas')}
            className={`px-4 py-2 rounded-md text-[13px] transition-smooth cursor-pointer ${
              activeTab === 'tarefas' 
                ? 'bg-[#09090b] border border-[#27272a] text-[#fafafa] font-medium shadow-sm' 
                : 'bg-transparent border border-transparent text-[#a1a1aa] hover:text-[#fafafa] font-normal'
            }`}
          >
            Tarefas
          </button>
          <button
            onClick={() => setActiveTab('estudos')}
            className={`px-4 py-2 rounded-md text-[13px] transition-smooth cursor-pointer ${
              activeTab === 'estudos' 
                ? 'bg-[#09090b] border border-[#27272a] text-[#fafafa] font-medium shadow-sm' 
                : 'bg-transparent border border-transparent text-[#a1a1aa] hover:text-[#fafafa] font-normal'
            }`}
          >
            Estudos
          </button>
          <button
            onClick={() => setActiveTab('habitos')}
            className={`px-4 py-2 rounded-md text-[13px] transition-smooth cursor-pointer ${
              activeTab === 'habitos' 
                ? 'bg-[#09090b] border border-[#27272a] text-[#fafafa] font-medium shadow-sm' 
                : 'bg-transparent border border-transparent text-[#a1a1aa] hover:text-[#fafafa] font-normal'
            }`}
          >
            Hábitos
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ÁREA DE CONTEÚDO PRINCIPAL (Diferenciando Notas das abas Em Breve) */}
        {/* ========================================================================= */}
        {activeTab === 'notas' ? (
          <div className="flex-1 flex overflow-hidden gap-4 md:gap-5 lg:gap-6 h-full relative">
            
            {/* COLUNA 1: Lista de Notas (Desktop/Tablet e Mobile sem seleção) */}
            <section className={`flex flex-col gap-3 w-full md:w-[240px] lg:w-[320px] shrink-0 h-full ${
              selectedId ? 'hidden md:flex' : 'flex'
            }`}>
              
              {/* Barra de Busca + Botão Criar */}
              <div className="flex items-center gap-2 w-full shrink-0">
                <div className="relative flex items-center gap-2 h-10 bg-[#18181b] border border-[#27272a] px-3 rounded-md flex-1">
                  <Search className="h-4 w-4 text-[#a1a1aa] shrink-0" />
                  <input
                    placeholder="Buscar notas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 outline-none text-[13px] text-[#fafafa] placeholder-[#a1a1aa]/50 w-full p-0 focus:ring-0 focus:border-0"
                  />
                </div>
                <button
                  onClick={handleCreateNote}
                  disabled={createMutation.isPending}
                  className="flex items-center justify-center h-10 w-10 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white rounded-md shrink-0 transition-smooth cursor-pointer disabled:opacity-50 shadow-md"
                  title="Criar nova nota"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>

              {/* Tags Estáticas do Módulo para Fidelidade do Design */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none shrink-0">
                <button className="px-3 py-1 rounded-md bg-[#6366f1] text-[#ffffff] text-[11px] font-medium shrink-0 cursor-pointer">
                  Todas
                </button>
                <button className="px-3 py-1 rounded-md bg-[#18181b] border border-[#27272a] text-[#a1a1aa]/65 text-[11px] font-normal shrink-0 cursor-not-allowed opacity-50">
                  Trabalho
                </button>
                <button className="px-3 py-1 rounded-md bg-[#18181b] border border-[#27272a] text-[#a1a1aa]/65 text-[11px] font-normal shrink-0 cursor-not-allowed opacity-50">
                  Pessoal
                </button>
                <button className="px-3 py-1 rounded-md bg-[#18181b] border border-[#27272a] text-[#a1a1aa]/65 text-[11px] font-normal shrink-0 cursor-not-allowed opacity-50">
                  Ideias
                </button>
              </div>

              {/* Listagem das notas */}
              <div className={`flex-1 overflow-y-auto space-y-2 pr-1 transition-opacity duration-200 ${isFetchingList ? 'opacity-65' : 'opacity-100'}`}>
                {notes.length === 0 ? (
                  <p className="text-center text-[11px] font-normal text-[#a1a1aa] mt-8">
                    Nenhuma nota encontrada.
                  </p>
                ) : (
                  notes.map((item) => {
                    const isActive = selectedId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`flex flex-col gap-1.5 p-3 rounded-md cursor-pointer transition-smooth border select-none ${
                          isActive 
                            ? 'bg-[#18181b] border-[#27272a]' 
                            : 'bg-transparent border-transparent hover:bg-[#18181b]/30'
                        }`}
                      >
                        <span className={`text-[13px] text-[#fafafa] truncate ${isActive ? 'font-medium' : 'font-normal'}`}>
                          {item.title || 'Sem título'}
                        </span>
                        {item.snippet && (
                          <p className="text-[11px] text-[#a1a1aa] line-clamp-2 leading-relaxed break-all m-0">
                            {item.snippet}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1 shrink-0">
                          <span className="text-[10px] text-[#a1a1aa]/75">
                            {new Date(item.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                          <span className="bg-[#27272a] text-[#a1a1aa] text-[9px] px-1.5 py-0.5 rounded-md font-medium shrink-0">
                            Nota
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* COLUNA 2: Editor de Notas (Desktop/Tablet e Mobile com seleção) */}
            <section className={`flex-1 flex flex-col bg-[#18181b] border border-[#27272a] rounded-lg h-full overflow-hidden ${
              selectedId ? 'flex' : 'hidden md:flex'
            }`}>
              
              {selectedId && isFetchingDetail && !detailData?.note ? (
                // Skeleton Loader enquanto baixa os detalhes
                <div className="flex-1 flex flex-col p-6 space-y-6 animate-pulse">
                  <div className="h-9 w-64 bg-[#27272a] border border-[#27272a] rounded" />
                  <div className="flex-1 space-y-4">
                    <div className="h-4.5 w-full bg-[#27272a] border border-[#27272a] rounded" />
                    <div className="h-4.5 w-5/6 bg-[#27272a] border border-[#27272a] rounded" />
                    <div className="h-4.5 w-4/5 bg-[#27272a] border border-[#27272a] rounded" />
                  </div>
                </div>
              ) : selectedId && detailData?.note ? (
                // Editor Completo
                <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
                  
                  {/* Topo do editor */}
                  <div className="flex items-center justify-between gap-4 p-6 pb-0 shrink-0 select-none">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Botão de voltar no mobile */}
                      <button
                        onClick={() => setSelectedId(undefined)}
                        className="md:hidden p-1.5 rounded-md hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] cursor-pointer shrink-0"
                        title="Voltar para a lista"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Input do Título */}
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={editorTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        onBlur={handleBlur}
                        placeholder="Título da nota"
                        className="bg-transparent border-0 outline-none text-lg font-semibold text-[#fafafa] placeholder-[#a1a1aa]/30 w-full p-0 focus:ring-0 focus:border-0 truncate"
                      />
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Tag Indicator */}
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#27272a]/40 text-[#a1a1aa]">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-[#6366f1]" />
                        <span className="text-[12px] font-normal">Nota</span>
                      </div>

                      {/* Botão de Excluir */}
                      <button
                        onClick={handleDeleteNote}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-md hover:bg-[#27272a] text-[#f43f5e] hover:text-[#ef4444] transition-smooth cursor-pointer disabled:opacity-50 shrink-0"
                        title="Excluir nota"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Linha Divisória */}
                  <div className="h-px bg-[#27272a] mx-6 mt-4 shrink-0" />

                  {/* Conteúdo */}
                  <div className="flex-1 flex flex-col px-6 py-6 overflow-hidden">
                    <textarea
                      value={editorContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onBlur={handleBlur}
                      placeholder="Comece a escrever sua nota aqui..."
                      className="w-full flex-1 bg-transparent border-0 outline-none resize-none text-[13px] text-[#fafafa] placeholder-[#a1a1aa]/30 leading-relaxed p-0 focus:ring-0 overflow-y-auto"
                    />

                    {/* Status Bar do auto-save */}
                    <div className="mt-4 shrink-0 flex items-center justify-between text-[11px] text-[#a1a1aa]/75 italic select-none">
                      <div>
                        {saveStatus === 'saved' && (
                          <span>Salvo automaticamente em tempo real</span>
                        )}
                        {saveStatus === 'typing' && (
                          <span className="text-amber-400/80 animate-pulse">Digitando...</span>
                        )}
                        {saveStatus === 'saving' && (
                          <span className="text-[#6366f1] flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin inline" /> Salvando...
                          </span>
                        )}
                        {saveStatus === 'error' && (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 inline" /> Erro ao salvar
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] not-italic text-[#a1a1aa]/50 font-normal">
                        Markdown suportado
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Placeholder (Nenhuma nota selecionada)
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-transparent animate-fade-in">
                  <div className="flex h-12 w-12 rounded-xl bg-[#09090b] border border-[#27272a] items-center justify-center text-[#a1a1aa] mb-4">
                    <FileText className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="text-[13px] font-medium text-[#fafafa] uppercase tracking-wider">
                    Minhas Notas
                  </h3>
                  <p className="text-[11px] text-[#a1a1aa] max-w-[240px] mt-2 leading-relaxed font-normal">
                    Selecione uma nota na lista lateral ou crie uma nova para começar a escrever suas ideias.
                  </p>
                </div>
              )}

            </section>
          </div>
        ) : (
          // =========================================================================
          // PÁGINA DE EM BREVE PREMIUM (Para as abas Tarefas, Estudos, Hábitos)
          // =========================================================================
          <div className="flex-1 flex flex-col bg-[#18181b] border border-[#27272a] rounded-lg h-full overflow-hidden items-center justify-center text-center p-8 animate-fade-in">
            <div className="flex h-12 w-12 rounded-xl bg-[#09090b] border border-[#27272a] items-center justify-center mb-4 shadow-inner">
              {activeTab === 'tarefas' && <ClipboardList className="h-5.5 w-5.5 text-[#6366f1]" />}
              {activeTab === 'estudos' && <GraduationCap className="h-5.5 w-5.5 text-amber-400" />}
              {activeTab === 'habitos' && <CalendarDays className="h-5.5 w-5.5 text-emerald-400" />}
            </div>
            <h3 className="text-[13px] font-medium text-[#fafafa] uppercase tracking-wider">
              {activeTab === 'tarefas' && 'Módulo de Tarefas'}
              {activeTab === 'estudos' && 'Módulo de Estudos'}
              {activeTab === 'habitos' && 'Módulo de Hábitos'}
            </h3>
            <span className={`inline-block text-[10px] font-medium uppercase px-2.5 py-0.5 rounded-full mt-2 border ${
              activeTab === 'tarefas' ? 'text-[#6366f1] bg-[#6366f1]/10 border-[#6366f1]/25' :
              activeTab === 'estudos' ? 'text-amber-400 bg-amber-400/10 border-amber-400/25' :
              'text-emerald-400 bg-emerald-400/10 border-emerald-400/25'
            }`}>
              Em Breve
            </span>
            <p className="text-[11px] text-[#a1a1aa] max-w-[280px] mt-3 leading-relaxed font-normal">
              {activeTab === 'tarefas' && 'Um painel Kanban completo integrado com listas de afazeres para você organizar suas entregas e atividades diárias.'}
              {activeTab === 'estudos' && 'Organize suas matérias, cronogramas de estudo e anotações acadêmicas integradas aos seus prazos do Life OS.'}
              {activeTab === 'habitos' && 'Acompanhe suas rotinas saudáveis com streaks diários, gráficos de progresso e lembretes inteligentes.'}
            </p>
          </div>
        )}

      </div>
    </AppShell>
  );
}
