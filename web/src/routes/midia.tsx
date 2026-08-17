import * as React from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Pencil,
  SkipForward,
  ChevronsRight,
  MonitorPlay,
  Loader2,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { AppShell } from '@layouts/AppShell';
import { ConfirmModal } from '@ui/ConfirmModal';
import {
  useGetSeries,
  usePostSeries,
  usePutSeriesId,
  useDeleteSeriesId,
  usePatchSeriesIdAdvance,
  getSeriesQueryKey,
} from '@core/api/gen/hooks';
import {
  formatMarcador,
  formatMinutagem,
  parseMinutagem,
} from '@features/midia/minutagem';

export const Route = createFileRoute('/midia')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: MidiaComponent,
});

type SeriesState = 'watching' | 'paused' | 'finished';

interface Serie {
  id: string;
  name: string;
  state: SeriesState;
  season: number;
  episode: number;
  positionSeconds: number;
  createdAt: string;
  updatedAt: string;
}

const STATE_TABS: { value: SeriesState; label: string }[] = [
  { value: 'watching', label: 'Assistindo' },
  { value: 'paused', label: 'Pausadas' },
  { value: 'finished', label: 'Concluídas' },
];

const STATE_LABEL: Record<SeriesState, string> = {
  watching: 'Assistindo',
  paused: 'Pausada',
  finished: 'Concluída',
};

const EMPTY_MESSAGE: Record<SeriesState, { title: string; hint: string }> = {
  watching: {
    title: 'Nenhuma série em andamento',
    hint: 'Cadastre uma série e o ponto de onde você volta a assistir.',
  },
  paused: {
    title: 'Nenhuma série pausada',
    hint: 'Séries que você interrompeu por tempo indeterminado aparecem aqui.',
  },
  finished: {
    title: 'Nenhuma série concluída',
    hint: 'Ao terminar uma série, marque como Concluída para tirá-la da lista principal.',
  },
};

function MidiaComponent() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<SeriesState>('watching');

  // Uma única query sem filtro: com no máximo 200 séries, filtrar no cliente
  // sai mais barato que três requisições e ainda dá as contagens das abas de graça.
  const { data, isLoading, isError, refetch } = useGetSeries();
  const series = (data?.series ?? []) as Serie[];

  const { mutateAsync: createSerie, isPending: isCreating } = usePostSeries();
  const { mutateAsync: updateSerie, isPending: isUpdating } = usePutSeriesId();
  const { mutateAsync: deleteSerie, isPending: isDeleting } = useDeleteSeriesId();
  const { mutateAsync: advanceSerie } = usePatchSeriesIdAdvance();

  // Trava só a linha que está avançando — o resto da lista segue clicável.
  const [advancingId, setAdvancingId] = React.useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Serie | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Serie | null>(null);

  const [formName, setFormName] = React.useState('');
  const [formSeason, setFormSeason] = React.useState('1');
  const [formEpisode, setFormEpisode] = React.useState('1');
  const [formMinutagem, setFormMinutagem] = React.useState('0:00');
  const [formState, setFormState] = React.useState<SeriesState>('watching');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getSeriesQueryKey() });
  };

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormSeason('1');
    setFormEpisode('1');
    setFormMinutagem('0:00');
    setFormState('watching');
    setIsFormOpen(true);
  };

  const openEdit = (serie: Serie) => {
    setEditing(serie);
    setFormName(serie.name);
    setFormSeason(String(serie.season));
    setFormEpisode(String(serie.episode));
    setFormMinutagem(formatMinutagem(serie.positionSeconds));
    setFormState(serie.state);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formName.trim();
    if (!name) {
      toast.error('Dê um nome para a série.');
      return;
    }

    const season = Number(formSeason);
    const episode = Number(formEpisode);
    if (!Number.isInteger(season) || season < 1) {
      toast.error('Temporada precisa ser um número inteiro a partir de 1.');
      return;
    }
    if (!Number.isInteger(episode) || episode < 1) {
      toast.error('Episódio precisa ser um número inteiro a partir de 1.');
      return;
    }

    const positionSeconds = parseMinutagem(formMinutagem);
    if (positionSeconds === null) {
      toast.error('Minutagem inválida. Use 24, 24:30 ou 1:05:30.');
      return;
    }

    try {
      if (editing) {
        await updateSerie({
          id: editing.id,
          data: { name, season, episode, positionSeconds, state: formState },
        });
        toast.success('Série atualizada.');
      } else {
        await createSerie({ data: { name, season, episode, positionSeconds } });
        toast.success('Série cadastrada.');
      }
      setIsFormOpen(false);
      setEditing(null);
      invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao salvar a série.'
      );
    }
  };

  const handleAdvance = async (serie: Serie, nextSeason: boolean) => {
    setAdvancingId(serie.id);
    try {
      const result = await advanceSerie({
        id: serie.id,
        data: nextSeason ? { nextSeason: true } : {},
      });
      const marcador = formatMarcador(
        result.series.season,
        result.series.episode
      );
      toast.success(`${serie.name} — agora em ${marcador}`);
      invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao avançar o marcador.'
      );
    } finally {
      setAdvancingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSerie({ id: confirmDelete.id });
      toast.success('Série excluída.');
      setConfirmDelete(null);
      invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao excluir a série.'
      );
    }
  };

  const countByState = (state: SeriesState) =>
    series.filter((s) => s.state === state).length;

  const visibleSeries = series.filter((s) => s.state === activeTab);

  return (
    <AppShell activeTab="midia">
      <div className="flex-1 flex flex-col gap-6 p-6 pb-24 md:p-8 md:pb-8 lg:px-16 lg:py-12 w-full max-w-[1440px] mx-auto overflow-y-auto">
        {/* ===================================================================== */}
        {/* CABEÇALHO */}
        {/* ===================================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground">
              Mídia
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Onde você volta a assistir em cada série
            </p>
          </div>

          <Button
            onClick={openCreate}
            className="h-9 gap-2 font-mono text-xs font-semibold w-fit"
          >
            <Plus className="h-4 w-4" />
            Nova série
          </Button>
        </div>

        {/* ===================================================================== */}
        {/* ABAS DE ESTADO */}
        {/* ===================================================================== */}
        <div className="flex items-center gap-2 border-b border-border pb-px overflow-x-auto">
          {STATE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 font-mono text-xs font-semibold rounded-t-md transition-all duration-150 border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.value
                  ? 'border-primary text-foreground bg-secondary/30'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-[10px] text-muted-foreground">
                {countByState(tab.value)}
              </span>
            </button>
          ))}
        </div>

        {/* ===================================================================== */}
        {/* LISTA */}
        {/* ===================================================================== */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-mono text-muted-foreground">
              Não foi possível carregar suas séries.
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="h-8 font-mono text-xs"
            >
              Tentar de novo
            </Button>
          </div>
        ) : visibleSeries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 border border-border">
              <MonitorPlay className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-mono font-semibold text-foreground">
                {EMPTY_MESSAGE[activeTab].title}
              </p>
              <p className="text-xs font-mono text-muted-foreground max-w-sm">
                {EMPTY_MESSAGE[activeTab].hint}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleSeries.map((serie) => {
              const isAdvancing = advancingId === serie.id;
              return (
                <div
                  key={serie.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors duration-150 hover:border-primary/40"
                >
                  {/* Nome + Marcador */}
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono text-sm font-semibold text-foreground truncate">
                      {serie.name}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-primary font-semibold">
                        {formatMarcador(serie.season, serie.episode)}
                      </span>
                      <span className="text-muted-foreground">
                        {serie.positionSeconds > 0
                          ? `parou aos ${formatMinutagem(serie.positionSeconds)}`
                          : 'não começado'}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      onClick={() => handleAdvance(serie, false)}
                      disabled={isAdvancing}
                      title="Terminei este episódio — avança para o próximo"
                      className="h-8 gap-1.5 px-3 font-mono text-xs font-semibold"
                    >
                      {isAdvancing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <SkipForward className="h-3.5 w-3.5" />
                      )}
                      +1 ep
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleAdvance(serie, true)}
                      disabled={isAdvancing}
                      title="Terminei a temporada — vai para o primeiro episódio da próxima"
                      className="h-8 gap-1.5 px-3 font-mono text-xs font-semibold"
                    >
                      <ChevronsRight className="h-3.5 w-3.5" />
                      Temporada
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(serie)}
                      title="Editar série e marcador"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDelete(serie)}
                      title="Excluir série"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* MODAL: NOVA / EDITAR SÉRIE */}
      {/* ======================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 flex flex-col gap-5 font-mono text-xs shadow-xl animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">
                {editing ? 'Editar série' : 'Nova série'}
              </h2>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                O marcador aponta para onde você <strong>volta a assistir</strong>,
                não para o último episódio visto. Terminou o T3E7? O marcador é
                T3E8 com minutagem zero.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase">
                  Nome
                </label>
                <Input
                  autoFocus
                  required
                  maxLength={150}
                  placeholder="Ex: Breaking Bad, One Piece..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Temporada
                  </label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={99}
                    value={formSeason}
                    onChange={(e) => setFormSeason(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Episódio
                  </label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={9999}
                    value={formEpisode}
                    onChange={(e) => setFormEpisode(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Minutagem
                  </label>
                  <Input
                    required
                    placeholder="0:00"
                    value={formMinutagem}
                    onChange={(e) => setFormMinutagem(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              {editing && (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Estado
                  </label>
                  <div className="flex gap-2 p-1 bg-secondary/30 rounded-md border border-border">
                    {STATE_TABS.map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setFormState(tab.value)}
                        className={`flex-1 py-1.5 text-center rounded-md font-semibold cursor-pointer transition-all duration-150 ${
                          formState === tab.value
                            ? 'bg-card text-primary border border-border shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {STATE_LABEL[tab.value]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditing(null);
                  }}
                  className="flex-1 h-9 font-mono text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 h-9 font-mono text-xs font-semibold"
                >
                  {isCreating || isUpdating ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Excluir série"
        description={`"${confirmDelete?.name}" e o marcador dela serão apagados. Não dá para desfazer.`}
        confirmText="Excluir"
      />
    </AppShell>
  );
}
