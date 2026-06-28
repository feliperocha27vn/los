import * as React from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { toast } from 'sonner';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Clock, 
  Check,
  CalendarDays
} from 'lucide-react';
import { Button } from '@ui/button';
import { Input } from '@ui/input';
import { AppShell } from '@layouts/AppShell';
import { ConfirmModal } from '@ui/ConfirmModal';

export const Route = createFileRoute('/agenda')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/',
      });
    }
  },
  component: AgendaComponent,
});

interface CalendarCategory {
  id: string;
  name: string;
  color: string; // hex
  checked: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  calendarId: string;
  startAt: Date;
  endAt: Date;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
}

interface ExpandedEvent extends CalendarEvent {
  occurrenceId: string;
  isRecurringOccurrence?: boolean;
}

const DEFAULT_CALENDARS: CalendarCategory[] = [
  { id: '1', name: 'Trabalho', color: '#6366f1', checked: true },
  { id: '2', name: 'Pessoal', color: '#10b981', checked: true },
  { id: '3', name: 'Saúde', color: '#f43f5e', checked: true }
];

const DEFAULT_EVENTS: CalendarEvent[] = [
  { 
    id: '1', 
    title: 'Daily Standup', 
    description: 'Sincronização diária do time de desenvolvimento.', 
    calendarId: '1', 
    startAt: new Date(2026, 5, 21, 9, 0), 
    endAt: new Date(2026, 5, 21, 9, 30), 
    recurrence: 'daily' 
  },
  { 
    id: '2', 
    title: 'Reunião de Alinhamento', 
    description: 'Discussão sobre os próximos módulos do Life OS.', 
    calendarId: '1', 
    startAt: new Date(2026, 5, 21, 14, 0), 
    endAt: new Date(2026, 5, 21, 15, 0), 
    recurrence: 'none' 
  },
  { 
    id: '3', 
    title: 'Almoço com Ana', 
    description: 'Almoço para colocar o papo em dia.', 
    calendarId: '2', 
    startAt: new Date(2026, 5, 24, 12, 30), 
    endAt: new Date(2026, 5, 24, 13, 30), 
    recurrence: 'none' 
  },
  { 
    id: '4', 
    title: 'Consulta Médica', 
    description: 'Consulta de rotina anual.', 
    calendarId: '3', 
    startAt: new Date(2026, 5, 26, 16, 0), 
    endAt: new Date(2026, 5, 26, 17, 0), 
    recurrence: 'none' 
  },
  { 
    id: '5', 
    title: 'Academia', 
    description: 'Treino de musculação diário.', 
    calendarId: '3', 
    startAt: new Date(2026, 5, 28, 15, 0), 
    endAt: new Date(2026, 5, 28, 16, 0), 
    recurrence: 'none' 
  }
];

function AgendaComponent() {
  const [activeView, setActiveView] = React.useState<'mes' | 'semana' | 'dia' | 'agenda'>('mes');
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date(2026, 5, 28)); // Focus on June 28, 2026 to match design
  const [calendars, setCalendars] = React.useState<CalendarCategory[]>(DEFAULT_CALENDARS);
  const [events, setEvents] = React.useState<CalendarEvent[]>(DEFAULT_EVENTS);

  // Form & Modals State
  const [isEventModalOpen, setIsEventModalOpen] = React.useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  
  // Event Form State
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventDesc, setEventDesc] = React.useState('');
  const [eventCalendarId, setEventCalendarId] = React.useState('1');
  const [eventDate, setEventDate] = React.useState('2026-06-28');
  const [eventStartHour, setEventStartHour] = React.useState('09:00');
  const [eventEndHour, setEventEndHour] = React.useState('10:00');
  const [eventRecurrence, setEventRecurrence] = React.useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [editingEventId, setEditingEventId] = React.useState<string | null>(null);

  // Calendar Form State
  const [calName, setCalName] = React.useState('');
  const [calColor, setCalColor] = React.useState('#6366f1');

  // Helper: Get days in month grid (42 days)
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days: Date[] = [];
    
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  // Helper: Get days in week grid (7 days)
  const getDaysInWeek = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day;
    const sunday = new Date(current.setDate(diff));
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Helper: Get 3 days for Mobile Week view
  const getDaysInMobileWeek = (date: Date) => {
    const current = new Date(date);
    const days: Date[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Helper: Expand recurring events
  const getExpandedEvents = React.useMemo(() => {
    const activeCalendarIds = calendars.filter(c => c.checked).map(c => c.id);
    const startRange = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    const endRange = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 2, 0);
    
    const result: ExpandedEvent[] = [];
    const filteredEvents = events.filter(e => activeCalendarIds.includes(e.calendarId));

    for (const event of filteredEvents) {
      if (event.recurrence === 'none') {
        if (event.startAt >= startRange && event.startAt <= endRange) {
          result.push({ ...event, occurrenceId: event.id });
        }
      } else if (event.recurrence === 'daily') {
        let current = new Date(event.startAt);
        const rangeStart = startRange > event.startAt ? startRange : event.startAt;
        current = new Date(rangeStart);
        current.setHours(event.startAt.getHours(), event.startAt.getMinutes(), 0, 0);

        while (current <= endRange) {
          const duration = event.endAt.getTime() - event.startAt.getTime();
          const startAt = new Date(current);
          const endAt = new Date(current.getTime() + duration);
          result.push({
            ...event,
            occurrenceId: `${event.id}-${current.toISOString().split('T')[0]}`,
            startAt,
            endAt,
            isRecurringOccurrence: true
          });
          current.setDate(current.getDate() + 1);
        }
      } else if (event.recurrence === 'weekly') {
        let current = new Date(event.startAt);
        const rangeStart = startRange > event.startAt ? startRange : event.startAt;
        current = new Date(rangeStart);
        const targetDay = event.startAt.getDay();
        while (current.getDay() !== targetDay) {
          current.setDate(current.getDate() + 1);
        }
        current.setHours(event.startAt.getHours(), event.startAt.getMinutes(), 0, 0);

        while (current <= endRange) {
          const duration = event.endAt.getTime() - event.startAt.getTime();
          const startAt = new Date(current);
          const endAt = new Date(current.getTime() + duration);
          result.push({
            ...event,
            occurrenceId: `${event.id}-${current.toISOString().split('T')[0]}`,
            startAt,
            endAt,
            isRecurringOccurrence: true
          });
          current.setDate(current.getDate() + 7);
        }
      }
    }
    return result;
  }, [events, calendars, selectedDate]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (activeView === 'mes') {
      d.setMonth(d.getMonth() - 1);
    } else if (activeView === 'semana') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(d);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (activeView === 'mes') {
      d.setMonth(d.getMonth() + 1);
    } else if (activeView === 'semana') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date(2026, 5, 28)); // Reset to June 28, 2026 to match mock data
  };

  // Toggle calendar filter
  const toggleCalendar = (id: string) => {
    setCalendars(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
  };

  // Handle Event Submit
  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      toast.error('O título do compromisso é obrigatório');
      return;
    }

    const startDateTime = new Date(`${eventDate}T${eventStartHour}`);
    const endDateTime = new Date(`${eventDate}T${eventEndHour}`);

    if (endDateTime <= startDateTime) {
      toast.error('A hora de fim deve ser posterior à hora de início');
      return;
    }

    if (editingEventId) {
      setEvents(prev => prev.map(ev => ev.id === editingEventId ? {
        ...ev,
        title: eventTitle,
        description: eventDesc,
        calendarId: eventCalendarId,
        startAt: startDateTime,
        endAt: endDateTime,
        recurrence: eventRecurrence
      } : ev));
      toast.success('Compromisso atualizado com sucesso');
    } else {
      const newEvent: CalendarEvent = {
        id: Math.random().toString(),
        title: eventTitle,
        description: eventDesc,
        calendarId: eventCalendarId,
        startAt: startDateTime,
        endAt: endDateTime,
        recurrence: eventRecurrence
      };
      setEvents(prev => [...prev, newEvent]);
      toast.success('Compromisso agendado com sucesso');
    }

    setIsEventModalOpen(false);
    resetEventForm();
  };

  const resetEventForm = () => {
    setEventTitle('');
    setEventDesc('');
    setEventCalendarId(calendars[0]?.id || '1');
    setEventDate(selectedDate.toISOString().split('T')[0]);
    setEventStartHour('09:00');
    setEventEndHour('10:00');
    setEventRecurrence('none');
    setEditingEventId(null);
  };

  const openCreateModal = (date: Date, hour?: string) => {
    resetEventForm();
    setEventDate(date.toISOString().split('T')[0]);
    if (hour) {
      setEventStartHour(hour);
      const [h, m] = hour.split(':').map(Number);
      const nextHour = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      setEventEndHour(nextHour);
    }
    setIsEventModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDesc(event.description || '');
    setEventCalendarId(event.calendarId);
    setEventDate(event.startAt.toISOString().split('T')[0]);
    setEventStartHour(event.startAt.toTimeString().substring(0, 5));
    setEventEndHour(event.endAt.toTimeString().substring(0, 5));
    setEventRecurrence(event.recurrence);
    setIsEventModalOpen(true);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEventId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEventId) {
      setEvents(prev => prev.filter(ev => ev.id !== selectedEventId));
      toast.success('Compromisso cancelado com sucesso');
      setIsDeleteConfirmOpen(false);
      setSelectedEventId(null);
    }
  };

  // Handle Calendar Submit
  const handleCalendarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calName.trim()) {
      toast.error('O nome do calendário é obrigatório');
      return;
    }

    const newCal: CalendarCategory = {
      id: Math.random().toString(),
      name: calName,
      color: calColor,
      checked: true
    };

    setCalendars(prev => [...prev, newCal]);
    toast.success('Calendário criado com sucesso');
    setCalName('');
    setIsCalendarModalOpen(false);
  };

  // Formatter helpers
  const formatMonthYear = (date: Date) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const formatFullDate = (date: Date) => {
    const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${daysOfWeek[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const getCalendarColor = (calId: string) => {
    return calendars.find(c => c.id === calId)?.color || '#6366f1';
  };

  const getCalendarName = (calId: string) => {
    return calendars.find(c => c.id === calId)?.name || '';
  };

  const dayHours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <AppShell activeTab="agenda">
      <div className="flex flex-col gap-6 h-full">
        
        {/* Header da Página */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold font-mono text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {activeView === 'mes' && 'Compromissos, tarefas e reuniões com hora marcada'}
            {activeView === 'semana' && 'Sua agenda organizada para a semana'}
            {activeView === 'dia' && 'Seu cronograma detalhado para hoje'}
            {activeView === 'agenda' && 'Lista completa de próximos compromissos'}
          </p>
        </div>

        {/* Grid Principal Layout (Sidebar Panel + Main Calendar) */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          
          {/* Painel Lateral (Apenas Desktop) */}
          <div className="hidden lg:flex flex-col gap-6 w-[240px] shrink-0">
            <Button 
              onClick={() => openCreateModal(selectedDate)}
              className="w-full justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs py-2.5 rounded-lg transition-smooth"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar
            </Button>

            {/* Listagem de Calendários */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold font-mono text-muted-foreground tracking-wider uppercase">
                Meus Calendários
              </span>
              <div className="flex flex-col gap-2">
                {calendars.map(cal => (
                  <label 
                    key={cal.id} 
                    className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-card/40 cursor-pointer transition-smooth group"
                  >
                    <input 
                      type="checkbox"
                      checked={cal.checked}
                      onChange={() => toggleCalendar(cal.id)}
                      className="sr-only"
                    />
                    <div 
                      className="h-3.5 w-3.5 rounded border border-border flex items-center justify-center transition-smooth shrink-0"
                      style={{ 
                        backgroundColor: cal.checked ? cal.color : 'transparent',
                        borderColor: cal.color 
                      }}
                    >
                      {cal.checked && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-xs font-mono text-foreground group-hover:text-white transition-smooth">
                      {cal.name}
                    </span>
                  </label>
                ))}
              </div>

              <Button 
                onClick={() => setIsCalendarModalOpen(true)}
                variant="ghost" 
                className="justify-start px-2 py-1 h-auto text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-transparent"
              >
                + Novo Calendário
              </Button>
            </div>
          </div>

          {/* Área Principal do Calendário */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            
            {/* Cabeçalho de Navegação e Filtros */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleToday}
                  variant="outline" 
                  className="h-9 px-4 font-mono text-xs text-foreground border-border bg-card hover:bg-card/65 transition-smooth"
                >
                  Hoje
                </Button>
                
                <div className="flex items-center gap-1">
                  <Button 
                    onClick={handlePrev}
                    variant="outline" 
                    className="h-9 w-9 p-0 text-foreground border-border bg-card hover:bg-card/65 transition-smooth"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleNext}
                    variant="outline" 
                    className="h-9 w-9 p-0 text-foreground border-border bg-card hover:bg-card/65 transition-smooth"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <span className="text-sm font-bold font-mono text-foreground shrink-0">
                  {activeView === 'mes' && formatMonthYear(selectedDate)}
                  {activeView === 'semana' && `Junho 2026`}
                  {activeView === 'dia' && formatFullDate(selectedDate)}
                  {activeView === 'agenda' && 'Próximos Compromissos'}
                </span>
              </div>

              {/* Seletor de Abas (Mês, Semana, Dia, Lista) */}
              <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-lg shrink-0">
                {(['mes', 'semana', 'dia', 'agenda'] as const).map(view => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`px-3 py-1.5 rounded-md font-mono text-xs transition-smooth capitalize ${
                      activeView === view 
                        ? 'bg-background text-foreground font-semibold border border-border/60' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {view === 'mes' ? 'Mês' : view === 'semana' ? 'Semana' : view === 'dia' ? 'Dia' : 'Agenda'}
                  </button>
                ))}
              </div>
            </div>

            {/* --- CONTEÚDO DO CALENDÁRIO --- */}
            <div className="flex-1 min-h-0">
              
              {/* 1. VISÃO MENSAL */}
              {activeView === 'mes' && (
                <div className="h-full flex flex-col border border-border rounded-lg bg-card overflow-hidden">
                  <div className="grid grid-cols-7 border-b border-border bg-card/45 select-none">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                      <div key={d} className="py-2.5 text-center text-[10px] font-bold font-mono text-muted-foreground uppercase">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 grid-rows-6 flex-1 divide-x divide-y divide-border border-t border-border bg-card">
                    {getDaysInMonth(selectedDate).map((day, idx) => {
                      const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                      const isToday = day.getDate() === 28 && day.getMonth() === 5 && day.getFullYear() === 2026;
                      
                      const dayEvents = getExpandedEvents.filter(ev => 
                        ev.startAt.getDate() === day.getDate() && 
                        ev.startAt.getMonth() === day.getMonth() &&
                        ev.startAt.getFullYear() === day.getFullYear()
                      );

                      return (
                        <div 
                          key={idx} 
                          onClick={() => openCreateModal(day)}
                          className={`p-1.5 flex flex-col gap-1 h-full min-h-[90px] cursor-pointer transition-smooth hover:bg-card/30 group relative ${
                            isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/30'
                          }`}
                        >
                          <div className="flex justify-between items-center select-none">
                            <span 
                              className={`text-[10px] font-mono font-bold h-5 w-5 rounded-full flex items-center justify-center transition-smooth ${
                                isToday 
                                  ? 'bg-indigo-600 text-white' 
                                  : isCurrentMonth 
                                    ? 'text-foreground' 
                                    : 'text-muted-foreground/30'
                              }`}
                            >
                              {day.getDate()}
                            </span>
                          </div>

                          <div className="hidden sm:flex flex-col gap-1 overflow-y-auto max-h-[70px] pr-0.5 w-full">
                            {dayEvents.map(ev => (
                              <div 
                                key={ev.occurrenceId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(ev);
                                }}
                                className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold text-white truncate transition-smooth hover:scale-[1.02] w-full"
                                style={{ backgroundColor: getCalendarColor(ev.calendarId) }}
                                title={`${ev.startAt.toTimeString().substring(0, 5)} - ${ev.title}`}
                              >
                                {ev.startAt.toTimeString().substring(0, 5)} {ev.title}
                              </div>
                            ))}
                          </div>

                          <div className="flex sm:hidden justify-center gap-0.5 mt-auto">
                            {dayEvents.slice(0, 3).map(ev => (
                              <div 
                                key={ev.occurrenceId}
                                className="h-1 w-1 rounded-full shrink-0"
                                style={{ backgroundColor: getCalendarColor(ev.calendarId) }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. VISÃO SEMANAL */}
              {activeView === 'semana' && (
                <div className="h-full flex flex-col sm:flex-row gap-4 overflow-y-auto pr-1">
                  
                  <div className="hidden sm:grid grid-cols-7 gap-3 h-full w-full">
                    {getDaysInWeek(selectedDate).map((day, idx) => {
                      const dayEvents = getExpandedEvents.filter(ev => 
                        ev.startAt.getDate() === day.getDate() && 
                        ev.startAt.getMonth() === day.getMonth() &&
                        ev.startAt.getFullYear() === day.getFullYear()
                      );
                      const isToday = day.getDate() === 28 && day.getMonth() === 5 && day.getFullYear() === 2026;

                      return (
                        <div 
                          key={idx}
                          className="flex flex-col gap-3 p-3 rounded-lg border border-border bg-card h-full min-w-0"
                        >
                          <div className="flex flex-col items-center select-none border-b border-border/50 pb-2">
                            <span className="text-[10px] font-bold font-mono text-muted-foreground uppercase">
                              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day.getDay()]}
                            </span>
                            <span 
                              className={`text-xs font-bold font-mono mt-1 h-5.5 w-5.5 rounded-full flex items-center justify-center ${
                                isToday ? 'bg-indigo-600 text-white' : 'text-foreground'
                              }`}
                            >
                              {day.getDate()}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col gap-2 overflow-y-auto w-full">
                            {dayEvents.map(ev => (
                              <div 
                                key={ev.occurrenceId}
                                onClick={() => openEditModal(ev)}
                                className="flex flex-col gap-1 p-2 rounded-lg cursor-pointer transition-smooth hover:scale-[1.02] w-full"
                                style={{ backgroundColor: `${getCalendarColor(ev.calendarId)}e5` }}
                              >
                                <span className="text-[10px] font-bold font-mono text-white leading-tight break-words w-full">
                                  {ev.title}
                                </span>
                                <span className="text-[8px] font-mono text-white/85">
                                  {ev.startAt.toTimeString().substring(0, 5)}
                                </span>
                              </div>
                            ))}

                            <button 
                              onClick={() => openCreateModal(day)}
                              className="w-full py-1.5 border border-dashed border-border hover:border-muted-foreground rounded-md text-[10px] font-mono text-muted-foreground hover:text-foreground transition-smooth mt-auto shrink-0"
                            >
                              + Agendar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex sm:hidden gap-2 h-full w-full">
                    {getDaysInMobileWeek(selectedDate).map((day, idx) => {
                      const dayEvents = getExpandedEvents.filter(ev => 
                        ev.startAt.getDate() === day.getDate() && 
                        ev.startAt.getMonth() === day.getMonth() &&
                        ev.startAt.getFullYear() === day.getFullYear()
                      );
                      const isToday = day.getDate() === 28 && day.getMonth() === 5 && day.getFullYear() === 2026;

                      return (
                        <div 
                          key={idx}
                          className="flex-1 flex flex-col gap-2 p-2 rounded-lg border border-border bg-card h-full min-w-0"
                        >
                          <div className="flex flex-col items-center select-none border-b border-border/50 pb-1">
                            <span className="text-[9px] font-bold font-mono text-muted-foreground uppercase">
                              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day.getDay()]}
                            </span>
                            <span 
                              className={`text-xs font-bold font-mono mt-0.5 h-5 w-5 rounded-full flex items-center justify-center ${
                                isToday ? 'bg-indigo-600 text-white' : 'text-foreground'
                              }`}
                            >
                              {day.getDate()}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto w-full">
                            {dayEvents.map(ev => (
                              <div 
                                key={ev.occurrenceId}
                                onClick={() => openEditModal(ev)}
                                className="flex flex-col p-1.5 rounded-md cursor-pointer transition-smooth w-full"
                                style={{ backgroundColor: getCalendarColor(ev.calendarId) }}
                              >
                                <span className="text-[9px] font-bold font-mono text-white truncate w-full">
                                  {ev.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* 3. VISÃO DIÁRIA */}
              {activeView === 'dia' && (
                <div className="h-full flex flex-col md:flex-row gap-6">
                  
                  <div className="flex-1 border border-border rounded-lg bg-card p-4 overflow-y-auto max-h-[500px] md:max-h-none">
                    <div className="flex flex-col gap-4">
                      {dayHours.map(hour => {
                        const [h] = hour.split(':').map(Number);
                        const hourEvents = getExpandedEvents.filter(ev => 
                          ev.startAt.getDate() === selectedDate.getDate() && 
                          ev.startAt.getMonth() === selectedDate.getMonth() &&
                          ev.startAt.getFullYear() === selectedDate.getFullYear() &&
                          ev.startAt.getHours() === h
                        );

                        return (
                          <div key={hour} className="flex items-start gap-4 min-h-[48px]">
                            <span className="text-xs font-mono text-muted-foreground w-10 text-right pt-0.5">
                              {hour}
                            </span>
                            
                            <div className="flex-1 flex flex-col gap-2">
                              {hourEvents.length > 0 ? (
                                hourEvents.map(ev => (
                                  <div 
                                    key={ev.occurrenceId}
                                    onClick={() => openEditModal(ev)}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/65 hover:bg-card cursor-pointer transition-smooth group"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getCalendarColor(ev.calendarId) }} />
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold font-mono text-foreground truncate">
                                          {ev.title}
                                        </span>
                                        {ev.description && (
                                          <span className="text-[10px] font-mono text-muted-foreground truncate">
                                            {ev.description}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-smooth shrink-0">
                                      <button 
                                        onClick={(e) => handleDeleteClick(ev.id, e)}
                                        className="p-1 text-muted-foreground hover:text-rose-500 rounded hover:bg-rose-500/10 transition-smooth"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div 
                                  onClick={() => openCreateModal(selectedDate, hour)}
                                  className="h-6 border-b border-border/55 cursor-pointer hover:border-muted-foreground transition-smooth flex items-center"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-full md:w-[320px] border border-border rounded-lg bg-card p-4 flex flex-col gap-4 shrink-0">
                    <span className="text-xs font-bold font-mono text-foreground border-b border-border pb-2 uppercase tracking-wide">
                      Compromissos do Dia
                    </span>
                    
                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                      {getExpandedEvents.filter(ev => 
                        ev.startAt.getDate() === selectedDate.getDate() && 
                        ev.startAt.getMonth() === selectedDate.getMonth() &&
                        ev.startAt.getFullYear() === selectedDate.getFullYear()
                      ).map(ev => (
                        <div 
                          key={ev.occurrenceId}
                          onClick={() => openEditModal(ev)}
                          className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-background hover:bg-card/25 cursor-pointer transition-smooth"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getCalendarColor(ev.calendarId) }} />
                            <span className="text-xs font-bold font-mono text-foreground truncate">
                              {ev.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {ev.startAt.toTimeString().substring(0, 5)} - {ev.endAt.toTimeString().substring(0, 5)}
                            </span>
                          </div>
                          {ev.description && (
                            <p className="text-[10px] font-mono text-muted-foreground leading-normal mt-0.5 line-clamp-2">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      ))}

                      {getExpandedEvents.filter(ev => 
                        ev.startAt.getDate() === selectedDate.getDate() && 
                        ev.startAt.getMonth() === selectedDate.getMonth() &&
                        ev.startAt.getFullYear() === selectedDate.getFullYear()
                      ).length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
                          <CalendarDays className="h-8 w-8 stroke-[1.5]" />
                          <span className="text-xs font-mono">Nenhum compromisso hoje</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* 4. VISÃO DE AGENDA (LISTA) */}
              {activeView === 'agenda' && (
                <div className="h-full border border-border rounded-lg bg-card p-4 overflow-y-auto">
                  <div className="flex flex-col gap-6">
                    {(() => {
                      const groupedEvents: { [key: string]: { date: Date; items: ExpandedEvent[] } } = {};
                      
                      getExpandedEvents
                        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
                        .forEach(ev => {
                          const dateKey = ev.startAt.toISOString().split('T')[0];
                          if (!groupedEvents[dateKey]) {
                            groupedEvents[dateKey] = { date: ev.startAt, items: [] };
                          }
                          groupedEvents[dateKey].items.push(ev);
                        });

                      const dates = Object.keys(groupedEvents).sort();

                      if (dates.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
                            <CalendarDays className="h-12 w-12 stroke-[1.2]" />
                            <span className="text-sm font-mono font-medium text-foreground">Nenhum compromisso agendado</span>
                            <span className="text-xs font-mono max-w-xs">Use o botão de criar ou clique nas grades para agendar seus compromissos.</span>
                          </div>
                        );
                      }

                      return dates.map(dateKey => {
                        const group = groupedEvents[dateKey];
                        return (
                          <div key={dateKey} className="flex flex-col md:flex-row gap-4 border-b border-border/40 pb-4">
                            <div className="w-full md:w-[200px] shrink-0 select-none">
                              <span className="block text-xs font-bold font-mono text-foreground">
                                {formatFullDate(group.date)}
                              </span>
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-2">
                              {group.items.map(ev => (
                                <div 
                                  key={ev.occurrenceId}
                                  onClick={() => openEditModal(ev)}
                                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-card/30 cursor-pointer transition-smooth group"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                                    <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground shrink-0">
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                                      <span>
                                        {ev.startAt.toTimeString().substring(0, 5)} - {ev.endAt.toTimeString().substring(0, 5)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getCalendarColor(ev.calendarId) }} />
                                      <span className="text-xs font-bold font-mono text-foreground truncate">
                                        {ev.title}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span 
                                      className="hidden sm:inline-block px-2 py-0.5 rounded text-[9px] font-mono font-medium text-white/90"
                                      style={{ backgroundColor: getCalendarColor(ev.calendarId) }}
                                    >
                                      {getCalendarName(ev.calendarId)}
                                    </span>
                                    
                                    <button 
                                      onClick={(e) => handleDeleteClick(ev.id, e)}
                                      className="p-1 text-muted-foreground hover:text-rose-500 rounded hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-smooth"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* --- MODAL DE CRIAR/EDITAR COMPROMISSO --- */}
        {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/65 backdrop-blur-sm p-4">
            <div className="w-full max-w-md border border-border rounded-lg bg-card shadow-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-sm font-bold font-mono text-foreground">
                  {editingEventId ? 'Editar Compromisso' : 'Agendar Novo Compromisso'}
                </h3>
              </div>

              <form onSubmit={handleEventSubmit} className="flex-1 p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold font-mono text-muted-foreground uppercase">
                    Título
                  </label>
                  <Input 
                    type="text"
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    placeholder="Ex: Reunião Diária"
                    className="font-mono text-xs text-foreground placeholder:text-muted-foreground/45 border-border bg-background focus:ring-1 focus:ring-indigo-500/40 transition-smooth"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold font-mono text-muted-foreground uppercase">
                    Descrição
                  </label>
                  <Input 
                    type="text"
                    value={eventDesc}
                    onChange={e => setEventDesc(e.target.value)}
                    placeholder="Detalhes adicionais (opcional)"
                    className="font-mono text-xs text-foreground placeholder:text-muted-foreground/45 border-border bg-background focus:ring-1 focus:ring-indigo-500/40 transition-smooth"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-muted-foreground uppercase">
                      Calendário
                    </label>
                    <select
                      value={eventCalendarId}
                      onChange={e => setEventCalendarId(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md font-mono text-xs text-foreground bg-background hover:border-muted-foreground focus:ring-1 focus:ring-indigo-500/40 transition-smooth outline-none"
                    >
                      {calendars.map(cal => (
                        <option key={cal.id} value={cal.id}>
                          {cal.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-muted-foreground uppercase">
                      Recorrência
                    </label>
                    <select
                      value={eventRecurrence}
                      onChange={e => setEventRecurrence(e.target.value as any)}
                      className="w-full px-3 py-2 border border-border rounded-md font-mono text-xs text-foreground bg-background hover:border-muted-foreground focus:ring-1 focus:ring-indigo-500/40 transition-smooth outline-none"
                    >
                      <option value="none">Não se repete</option>
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold font-mono text-muted-foreground uppercase">
                    Data
                  </label>
                  <Input 
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="font-mono text-xs text-foreground border-border bg-background focus:ring-1 focus:ring-indigo-500/40 transition-smooth"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-muted-foreground uppercase">
                      Início
                    </label>
                    <Input 
                      type="time"
                      value={eventStartHour}
                      onChange={e => setEventStartHour(e.target.value)}
                      className="font-mono text-xs text-foreground border-border bg-background focus:ring-1 focus:ring-indigo-500/40 transition-smooth"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold font-mono text-muted-foreground uppercase">
                      Fim
                    </label>
                    <Input 
                      type="time"
                      value={eventEndHour}
                      onChange={e => setEventEndHour(e.target.value)}
                      className="font-mono text-xs text-foreground border-border bg-background focus:ring-1 focus:ring-indigo-500/40 transition-smooth"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-2">
                  <Button 
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    variant="outline"
                    className="font-mono text-xs text-foreground border-border bg-transparent hover:bg-card/55 transition-smooth"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs px-4"
                  >
                    Salvar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL DE CRIAR CALENDÁRIO --- */}
        {isCalendarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/65 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm border border-border rounded-lg bg-card shadow-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-sm font-bold font-mono text-foreground">Novo Calendário</h3>
              </div>

              <form onSubmit={handleCalendarSubmit} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold font-mono text-muted-foreground uppercase">
                    Nome
                  </label>
                  <Input 
                    type="text"
                    value={calName}
                    onChange={e => setCalName(e.target.value)}
                    placeholder="Ex: Estudos, Finanças"
                    className="font-mono text-xs text-foreground placeholder:text-muted-foreground/45 border-border bg-background focus:ring-1 focus:ring-indigo-500/40 transition-smooth"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold font-mono text-muted-foreground uppercase">
                    Cor
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      value={calColor}
                      onChange={e => setCalColor(e.target.value)}
                      className="h-9 w-9 rounded-md border border-border bg-background cursor-pointer outline-none shrink-0"
                    />
                    <span className="font-mono text-xs text-muted-foreground uppercase">
                      {calColor}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border pt-4 mt-2">
                  <Button 
                    type="button"
                    onClick={() => setIsCalendarModalOpen(false)}
                    variant="outline"
                    className="font-mono text-xs text-foreground border-border bg-transparent hover:bg-card/55 transition-smooth"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs px-4"
                  >
                    Criar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- CONFIRMAÇÃO DE DELETAR COMPROMISSO --- */}
        <ConfirmModal 
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          isLoading={false}
          title="Cancelar Compromisso"
          description="Tem certeza que deseja cancelar este compromisso? Esta ação não pode ser desfeita."
          confirmText="Sim, cancelar"
          cancelText="Não, manter"
        />

      </div>
    </AppShell>
  );
}
