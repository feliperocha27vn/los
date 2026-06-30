import * as React from 'react';
import * as LucideIcons from 'lucide-react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Trash2, 
  ChevronLeft, 
  FileText, 
  AlertCircle, 
  Loader2,
  CalendarDays,
  Edit,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Folder,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { AppShell } from '@layouts/AppShell';
import { ConfirmModal } from '@ui/ConfirmModal';
import { Input } from '@ui/input';
import { Button } from '@ui/button';
import { cn } from '@core/utils';
import { 
  useGetNotes, 
  useGetNotesId, 
  usePostNotes, 
  usePutNotesId, 
  useDeleteNotesId,
  getNotesQueryKey,
  getNotesIdQueryKey,
  useGetTasks,
  usePostTasks,
  usePutTasksId,
  useDeleteTasksId,
  usePatchTasksIdMove,
  getTasksQueryKey,
  useGetCourses,
  usePostCourses,
  usePutCoursesId,
  useDeleteCoursesId,
  usePatchCoursesIdReorder,
  getCoursesQueryKey,
  useGetModules,
  usePostModules,
  usePutModulesId,
  useDeleteModulesId,
  usePatchModulesIdReorder,
  getModulesQueryKey,
  useGetPages,
  useGetPagesId,
  usePostPages,
  usePutPagesId,
  useDeletePagesId,
  usePatchPagesIdReorder,
  getPagesQueryKey,
  getPagesIdQueryKey,
  useGetTrackerHabits,
  usePostTrackerHabits,
  usePutTrackerHabitsId,
  useDeleteTrackerHabitsId,
  usePatchTrackerHabitsIdReorder,
  useGetTrackerToday,
  useGetTrackerDays,
  usePutTrackerRecords,
  useDeleteTrackerRecordsId,
  getTrackerHabitsQueryKey,
  getTrackerTodayQueryKey,
  getTrackerDaysQueryKey
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

const COMMON_HABIT_ICONS = [
  { name: 'Activity', label: 'Exercício' },
  { name: 'BookOpen', label: 'Leitura' },
  { name: 'Flame', label: 'Foco/Energia' },
  { name: 'Heart', label: 'Saúde' },
  { name: 'Smile', label: 'Bem-estar' },
  { name: 'Coffee', label: 'Alimentação' },
  { name: 'Brain', label: 'Meditação/Estudo' },
  { name: 'Droplet', label: 'Água' },
  { name: 'Moon', label: 'Sono' },
  { name: 'DollarSign', label: 'Finanças' },
  { name: 'CheckSquare', label: 'Rotina' },
  { name: 'Sun', label: 'Manhã' },
];

const HabitIconHelper = ({ name, className }: { name: string; className?: string }) => {
  const IconComp = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
  return <IconComp className={className} />;
};

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
  const contentTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Estado da nova feature: full-width (persistido) e visibilidade do preview (mobile)
  const [isFullWidth, setIsFullWidth] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('notes-editor-fullwidth') === 'true';
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('notes-editor-fullwidth', isFullWidth ? 'true' : 'false');
  }, [isFullWidth]);

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

  // =========================================================================
  // TAREFAS (KANBAN) - ESTADOS, HOOKS E HANDLERS
  // =========================================================================
  const [taskSearchQuery, setTaskSearchQuery] = React.useState('');
  const [activeMobileColumn, setActiveMobileColumn] = React.useState<'todo' | 'in_progress' | 'done'>('todo');

  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<any | null>(null);
  const [taskFormTitle, setTaskFormTitle] = React.useState('');
  const [taskFormDescription, setTaskFormDescription] = React.useState('');
  const [taskFormColumn, setTaskFormColumn] = React.useState<'todo' | 'in_progress' | 'done'>('todo');
  const [taskFormError, setTaskFormError] = React.useState<string | null>(null);

  const [taskToDelete, setTaskToDelete] = React.useState<any | null>(null);
  const [isTaskDeleteModalOpen, setIsTaskDeleteModalOpen] = React.useState(false);

  const { data: tasksData, isFetching: isFetchingTasks } = useGetTasks({
    search: taskSearchQuery || undefined
  }, {
    query: {
      enabled: activeTab === 'tarefas',
      retry: false,
      staleTime: 0,
    }
  });

  const createTaskMutation = usePostTasks();
  const updateTaskMutation = usePutTasksId();
  const deleteTaskMutation = useDeleteTasksId();
  const moveTaskMutation = usePatchTasksIdMove({
    mutation: {
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: getTasksQueryKey() });
        const previousTasks = queryClient.getQueryData(getTasksQueryKey());
        queryClient.setQueryData(getTasksQueryKey(), (old: any) => {
          if (!old?.tasks) return old;
          return {
            ...old,
            tasks: old.tasks.map((t: any) =>
              t.id === id ? { ...t, column: data.column, position: data.position } : t,
            ),
          };
        });
        return { previousTasks };
      },
      onError: (_err, _vars, context) => {
        if (context?.previousTasks) {
          queryClient.setQueryData(getTasksQueryKey(), context.previousTasks);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: getTasksQueryKey() });
      },
    },
  });

  const handleOpenCreateTask = (col: 'todo' | 'in_progress' | 'done' = 'todo') => {
    setEditingTask(null);
    setTaskFormTitle('');
    setTaskFormDescription('');
    setTaskFormColumn(col);
    setTaskFormError(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: any) => {
    setEditingTask(task);
    setTaskFormTitle(task.title);
    setTaskFormDescription(task.description || '');
    setTaskFormColumn(task.column);
    setTaskFormError(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError(null);

    if (!taskFormTitle.trim()) {
      setTaskFormError('O título é obrigatório.');
      return;
    }

    try {
      if (editingTask) {
        if (taskFormColumn !== editingTask.column) {
          const colTasks = (tasksData?.tasks || [])
            .filter((t: any) => t.column === taskFormColumn && t.id !== editingTask.id)
            .sort((a: any, b: any) => a.position - b.position);
          const maxPos = colTasks.length > 0 ? colTasks[colTasks.length - 1].position : 0.0;
          await moveTaskMutation.mutateAsync({
            id: editingTask.id,
            data: {
              column: taskFormColumn,
              position: maxPos + 1.0
            }
          });
        }

        await updateTaskMutation.mutateAsync({
          id: editingTask.id,
          data: {
            title: taskFormTitle,
            description: taskFormDescription || undefined
          }
        });
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        await createTaskMutation.mutateAsync({
          data: {
            title: taskFormTitle,
            description: taskFormDescription || undefined,
            column: taskFormColumn
          }
        });
        toast.success('Tarefa criada com sucesso!');
      }
      queryClient.invalidateQueries({ queryKey: getTasksQueryKey() });
      setIsTaskModalOpen(false);
    } catch (err: any) {
      setTaskFormError(err.data?.message || 'Erro ao salvar tarefa.');
    }
  };

  const handleDeleteTaskClick = (task: any) => {
    setTaskToDelete(task);
    setIsTaskDeleteModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTaskMutation.mutateAsync({ id: taskToDelete.id });
      queryClient.invalidateQueries({ queryKey: getTasksQueryKey() });
      setIsTaskDeleteModalOpen(false);
      setTaskToDelete(null);
      toast.success('Tarefa excluída com sucesso!');
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao excluir tarefa.');
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string, sourceCol: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.setData('source-column', sourceCol);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleMoveTask = async (taskId: string, targetCol: 'todo' | 'in_progress' | 'done', targetIndex?: number) => {
    const columnTasks = [...(tasksData?.tasks || [])]
      .filter((t: any) => t.column === targetCol && t.id !== taskId)
      .sort((a: any, b: any) => a.position - b.position);

    let newPosition = 1.0;

    if (columnTasks.length === 0) {
      newPosition = 1.0;
    } else if (targetIndex === 0) {
      newPosition = columnTasks[0].position / 2;
    } else if (targetIndex === undefined || targetIndex >= columnTasks.length) {
      newPosition = columnTasks[columnTasks.length - 1].position + 1.0;
    } else {
      const prevTask = columnTasks[targetIndex - 1];
      const nextTask = columnTasks[targetIndex];
      newPosition = (prevTask.position + nextTask.position) / 2;
    }

    try {
      await moveTaskMutation.mutateAsync({
        id: taskId,
        data: {
          column: targetCol,
          position: newPosition
        }
      });
    } catch (err: any) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 409) {
        recalculateAndMoveTasks(taskId, targetCol, targetIndex);
      } else {
        toast.error(err.data?.message || 'Erro ao mover tarefa');
      }
    }
  };

  const recalculateAndMoveTasks = async (taskId: string, targetCol: 'todo' | 'in_progress' | 'done', targetIndex?: number) => {
    toast.info('Reordenando coluna para evitar colisão...');
    const columnTasks = [...(tasksData?.tasks || [])]
      .filter((t: any) => t.column === targetCol && t.id !== taskId)
      .sort((a: any, b: any) => a.position - b.position);

    const insertIdx = targetIndex === undefined ? columnTasks.length : targetIndex;
    columnTasks.splice(insertIdx, 0, { id: taskId } as any);

    try {
      for (let i = 0; i < columnTasks.length; i++) {
        await moveTaskMutation.mutateAsync({
          id: columnTasks[i].id,
          data: {
            column: targetCol,
            position: i + 1.0
          }
        });
      }
      toast.success('Coluna reordenada!');
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao reordenar tarefas');
    }
  };

  const moveTaskDirectly = async (task: any, direction: 'left' | 'right') => {
    const columns: ('todo' | 'in_progress' | 'done')[] = ['todo', 'in_progress', 'done'];
    const currentIdx = columns.indexOf(task.column);
    const targetIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= columns.length) return;
    const targetCol = columns[targetIdx];
    
    const colTasks = (tasksData?.tasks || [])
      .filter((t: any) => t.column === targetCol)
      .sort((a: any, b: any) => a.position - b.position);
    const maxPos = colTasks.length > 0 ? colTasks[colTasks.length - 1].position : 0.0;
    
    try {
      await moveTaskMutation.mutateAsync({
        id: task.id,
        data: {
          column: targetCol,
          position: maxPos + 1.0
        }
      });
      toast.success('Tarefa movida!');
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao mover tarefa');
    }
  };


  // =========================================================================
  // ESTUDOS - ESTADOS, HOOKS E HANDLERS
  // =========================================================================
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | undefined>(undefined);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = React.useState(false);
  const [selectedPageId, setSelectedPageId] = React.useState<string | undefined>(undefined);
  const [expandedModules, setExpandedModules] = React.useState<Record<string, boolean>>({});

  // Modais de Estudos
  const [isCourseModalOpen, setIsCourseModalOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState<any | null>(null);
  const [courseFormName, setCourseFormName] = React.useState('');

  const [isModuleModalOpen, setIsModuleModalOpen] = React.useState(false);
  const [editingModule, setEditingModule] = React.useState<any | null>(null);
  const [moduleFormName, setModuleFormName] = React.useState('');
  const [moduleFormCourseId, setModuleFormCourseId] = React.useState('');

  const [isPageModalOpen, setIsPageModalOpen] = React.useState(false);
  const [editingPage, setEditingPage] = React.useState<any | null>(null);
  const [pageFormTitle, setPageFormTitle] = React.useState('');
  const [pageFormModuleId, setPageFormModuleId] = React.useState('');

  const [studyDeleteTarget, setStudyDeleteTarget] = React.useState<{ type: 'course' | 'module' | 'page'; id: string; name: string } | null>(null);
  const [isStudyDeleteModalOpen, setIsStudyDeleteModalOpen] = React.useState(false);

  // Queries e Mutações de Estudos
  const { data: coursesData } = useGetCourses({
    query: {
      enabled: activeTab === 'estudos',
      retry: false,
      staleTime: 0
    }
  });

  const { data: modulesData } = useGetModules(undefined, {
    query: {
      enabled: activeTab === 'estudos',
      retry: false,
      staleTime: 0
    }
  });

  const { data: pagesData } = useGetPages(undefined, {
    query: {
      enabled: activeTab === 'estudos',
      retry: false,
      staleTime: 0
    }
  });

  const { data: pageDetailData } = useGetPagesId(selectedPageId, {
    query: {
      enabled: activeTab === 'estudos' && !!selectedPageId,
      retry: false
    }
  });

  const createCourseMutation = usePostCourses();
  const updateCourseMutation = usePutCoursesId();
  const deleteCourseMutation = useDeleteCoursesId();
  const reorderCourseMutation = usePatchCoursesIdReorder();

  const createModuleMutation = usePostModules();
  const updateModuleMutation = usePutModulesId();
  const deleteModuleMutation = useDeleteModulesId();
  const reorderModuleMutation = usePatchModulesIdReorder();

  const createPageMutation = usePostPages();
  const updatePageMutation = usePutPagesId();
  const deletePageMutation = useDeletePagesId();
  const reorderPageMutation = usePatchPagesIdReorder();

  // =========================================================================
  // ESTADOS E HOOKS DO RASTREADOR DE HÁBITOS
  // =========================================================================
  const [isHabitManagerOpen, setIsHabitManagerOpen] = React.useState(false);
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = React.useState(false);
  const [selectedDayDate, setSelectedDayDate] = React.useState('');
  const [dayDetailEnergy, setDayDetailEnergy] = React.useState<'low' | 'medium' | 'high' | null>(null);
  const [dayDetailQuality, setDayDetailQuality] = React.useState<'weak' | 'ok' | 'strong' | null>(null);
  
  const [isCreateHabitOpen, setIsCreateHabitOpen] = React.useState(false);
  const [editingHabit, setEditingHabit] = React.useState<any | null>(null);
  const [habitName, setHabitName] = React.useState('');
  const [habitIcon, setHabitIcon] = React.useState('Activity');

  const [selectedMobileDate, setSelectedMobileDate] = React.useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const trackerDateRange = React.useMemo(() => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 6); // 7 dias
    
    const format = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    
    return {
      from: format(fromDate),
      to: format(toDate)
    };
  }, []);

  const generatedDates = React.useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      list.push(`${yyyy}-${mm}-${dd}`);
    }
    return list;
  }, []);

  const { data: habitsData, refetch: refetchHabits } = useGetTrackerHabits(undefined, {
    query: {
      enabled: activeTab === 'habitos',
      retry: false,
      staleTime: 0
    }
  });

  const { data: todayData, refetch: refetchToday } = useGetTrackerToday({
    query: {
      enabled: activeTab === 'habitos',
      retry: false,
      staleTime: 0
    }
  });

  const { data: daysData, refetch: refetchDays } = useGetTrackerDays(trackerDateRange, {
    query: {
      enabled: activeTab === 'habitos',
      retry: false,
      staleTime: 0
    }
  });

  const createHabitMutation = usePostTrackerHabits();
  const updateHabitMutation = usePutTrackerHabitsId();
  const deleteHabitMutation = useDeleteTrackerHabitsId();
  const reorderHabitMutation = usePatchTrackerHabitsIdReorder();
  const upsertRecordMutation = usePutTrackerRecords();
  const deleteRecordMutation = useDeleteTrackerRecordsId();

  // Estado Local do Editor de Estudos para Auto-Save
  const [studyEditorPageId, setStudyEditorPageId] = React.useState<string | null>(null);
  const [studyEditorTitle, setStudyEditorTitle] = React.useState('');
  const [studyEditorContent, setStudyEditorContent] = React.useState('');
  const [studySaveStatus, setStudySaveStatus] = React.useState<SaveStatus>('saved');

  const studyDebounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const studyPendingChangesRef = React.useRef<{ title?: string; content?: string } | null>(null);

  // Sincroniza o estado local do editor quando a página selecionada muda
  if (pageDetailData?.page && pageDetailData.page.id !== studyEditorPageId) {
    setStudyEditorPageId(pageDetailData.page.id);
    setStudyEditorTitle(pageDetailData.page.title);
    setStudyEditorContent(pageDetailData.page.content || '');
    setStudySaveStatus('saved');
    studyPendingChangesRef.current = null;
    if (studyDebounceTimerRef.current) {
      clearTimeout(studyDebounceTimerRef.current);
      studyDebounceTimerRef.current = null;
    }
  }

  // Sincroniza o curso selecionado (auto-seleciona o primeiro se nenhum selecionado)
  if (activeTab === 'estudos') {
    const courses = coursesData?.courses || [];
    if (courses.length > 0) {
      if (!selectedCourseId || !courses.some((c: any) => c.id === selectedCourseId)) {
        const sortedCourses = [...courses].sort((a: any, b: any) => a.position - b.position);
        setSelectedCourseId(sortedCourses[0].id);
      }
    } else if (selectedCourseId !== undefined) {
      setSelectedCourseId(undefined);
    }
  }

  const selectedCourse = selectedCourseId
    ? (coursesData?.courses || []).find((c: any) => c.id === selectedCourseId)
    : null;

  const courseModules = selectedCourseId
    ? (modulesData?.modules || [])
        .filter((m: any) => m.courseId === selectedCourseId)
        .sort((a: any, b: any) => a.position - b.position)
    : [];

  const triggerStudySave = React.useCallback(async () => {
    if (!selectedPageId || !studyPendingChangesRef.current) return;

    const payload = { ...studyPendingChangesRef.current };
    studyPendingChangesRef.current = null;

    if (studyDebounceTimerRef.current) {
      clearTimeout(studyDebounceTimerRef.current);
      studyDebounceTimerRef.current = null;
    }

    setStudySaveStatus('saving');
    try {
      await updatePageMutation.mutateAsync({
        id: selectedPageId,
        data: payload
      });
      setStudySaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: getPagesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getPagesIdQueryKey(selectedPageId) });
    } catch {
      studyPendingChangesRef.current = { ...payload, ...(studyPendingChangesRef.current || {}) };
      setStudySaveStatus('error');
    }
  }, [selectedPageId, updatePageMutation, queryClient]);

  const scheduleStudySave = React.useCallback((updatedFields: { title?: string; content?: string }) => {
    studyPendingChangesRef.current = {
      ...(studyPendingChangesRef.current || {}),
      ...updatedFields
    };
    setStudySaveStatus('typing');
    if (studyDebounceTimerRef.current) {
      clearTimeout(studyDebounceTimerRef.current);
    }
    studyDebounceTimerRef.current = setTimeout(() => {
      triggerStudySave();
    }, 1000);
  }, [triggerStudySave]);

  const handleStudyTitleChange = (newTitle: string) => {
    setStudyEditorTitle(newTitle);
    scheduleStudySave({ title: newTitle });
  };

  const handleStudyContentChange = (newContent: string) => {
    setStudyEditorContent(newContent);
    scheduleStudySave({ content: newContent });
  };

  const handleStudyBlur = () => {
    if (studyPendingChangesRef.current) {
      triggerStudySave();
    }
  };



  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  // Handlers CRUD - Cursos
  const handleOpenCreateCourse = () => {
    setEditingCourse(null);
    setCourseFormName('');
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: any) => {
    setEditingCourse(course);
    setCourseFormName(course.name);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormName.trim()) return;

    try {
      if (editingCourse) {
        await updateCourseMutation.mutateAsync({
          id: editingCourse.id,
          data: { name: courseFormName }
        });
        toast.success('Curso atualizado com sucesso!');
      } else {
        await createCourseMutation.mutateAsync({
          data: { name: courseFormName }
        });
        toast.success('Curso criado com sucesso!');
      }
      queryClient.invalidateQueries({ queryKey: getCoursesQueryKey() });
      setIsCourseModalOpen(false);
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao salvar curso');
    }
  };

  // Handlers CRUD - Módulos
  const handleOpenCreateModule = (courseId: string) => {
    setEditingModule(null);
    setModuleFormCourseId(courseId);
    setModuleFormName('');
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (module: any) => {
    setEditingModule(module);
    setModuleFormCourseId(module.courseId);
    setModuleFormName(module.name);
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleFormName.trim()) return;

    try {
      if (editingModule) {
        await updateModuleMutation.mutateAsync({
          id: editingModule.id,
          data: { name: moduleFormName }
        });
        toast.success('Módulo atualizado com sucesso!');
      } else {
        await createModuleMutation.mutateAsync({
          data: {
            courseId: moduleFormCourseId,
            name: moduleFormName
          }
        });
        toast.success('Módulo criado com sucesso!');
      }
      queryClient.invalidateQueries({ queryKey: getModulesQueryKey() });
      setIsModuleModalOpen(false);
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao salvar módulo');
    }
  };

  // Handlers CRUD - Páginas
  const handleOpenCreatePage = (moduleId: string) => {
    setEditingPage(null);
    setPageFormModuleId(moduleId);
    setPageFormTitle('');
    setIsPageModalOpen(true);
  };


  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageFormTitle.trim()) return;

    try {
      if (editingPage) {
        await updatePageMutation.mutateAsync({
          id: editingPage.id,
          data: { title: pageFormTitle }
        });
        toast.success('Página atualizada com sucesso!');
      } else {
        const res = await createPageMutation.mutateAsync({
          data: {
            moduleId: pageFormModuleId,
            title: pageFormTitle
          }
        });
        // Abre o editor imediatamente
        setSelectedPageId(res.page.id);
        toast.success('Página criada com sucesso!');
      }
      queryClient.invalidateQueries({ queryKey: getPagesQueryKey() });
      setIsPageModalOpen(false);
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao salvar página');
    }
  };

  // Deletar item de Estudos (Curso, Módulo ou Página)
  const handleDeleteStudyClick = (type: 'course' | 'module' | 'page', id: string, name: string) => {
    setStudyDeleteTarget({ type, id, name });
    setIsStudyDeleteModalOpen(true);
  };

  const confirmDeleteStudy = async () => {
    if (!studyDeleteTarget) return;

    try {
      if (studyDeleteTarget.type === 'course') {
        await deleteCourseMutation.mutateAsync({ id: studyDeleteTarget.id });
        queryClient.invalidateQueries({ queryKey: getCoursesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getModulesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getPagesQueryKey() });
      } else if (studyDeleteTarget.type === 'module') {
        await deleteModuleMutation.mutateAsync({ id: studyDeleteTarget.id });
        queryClient.invalidateQueries({ queryKey: getModulesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getPagesQueryKey() });
      } else {
        await deletePageMutation.mutateAsync({ id: studyDeleteTarget.id });
        queryClient.invalidateQueries({ queryKey: getPagesQueryKey() });
        if (selectedPageId === studyDeleteTarget.id) {
          setSelectedPageId(undefined);
          setStudyEditorPageId(null);
        }
      }
      setIsStudyDeleteModalOpen(false);
      setStudyDeleteTarget(null);
      toast.success('Excluído com sucesso!');
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao deletar recurso');
    }
  };

  // Reordenação de Estudos
  const handleReorderStudyItem = async (type: 'course' | 'module' | 'page', id: string, direction: 'up' | 'down') => {
    try {
      if (type === 'course') {
        const items = [...(coursesData?.courses || [])].sort((a, b) => a.position - b.position);
        const idx = items.findIndex(item => item.id === id);
        if (idx === -1) return;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= items.length) return;

        let newPos = 1.0;
        if (targetIdx === 0) {
          newPos = items[0].position / 2;
        } else if (targetIdx === items.length - 1) {
          newPos = items[items.length - 1].position + 1.0;
        } else {
          if (direction === 'up') {
            newPos = (items[targetIdx - 1].position + items[targetIdx].position) / 2;
          } else {
            newPos = (items[targetIdx].position + items[targetIdx + 1].position) / 2;
          }
        }
        await reorderCourseMutation.mutateAsync({ id, data: { position: newPos } });
        queryClient.invalidateQueries({ queryKey: getCoursesQueryKey() });
      } else if (type === 'module') {
        const activeCourseId = modulesData?.modules.find((m: any) => m.id === id)?.courseId;
        if (!activeCourseId) return;
        const items = [...(modulesData?.modules || [])].filter((m: any) => m.courseId === activeCourseId).sort((a, b) => a.position - b.position);
        const idx = items.findIndex(item => item.id === id);
        if (idx === -1) return;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= items.length) return;

        let newPos = 1.0;
        if (targetIdx === 0) {
          newPos = items[0].position / 2;
        } else if (targetIdx === items.length - 1) {
          newPos = items[items.length - 1].position + 1.0;
        } else {
          if (direction === 'up') {
            newPos = (items[targetIdx - 1].position + items[targetIdx].position) / 2;
          } else {
            newPos = (items[targetIdx].position + items[targetIdx + 1].position) / 2;
          }
        }
        await reorderModuleMutation.mutateAsync({ id, data: { position: newPos } });
        queryClient.invalidateQueries({ queryKey: getModulesQueryKey() });
      } else {
        const activeModuleId = pagesData?.pages.find((p: any) => p.id === id)?.moduleId;
        if (!activeModuleId) return;
        const items = [...(pagesData?.pages || [])].filter((p: any) => p.moduleId === activeModuleId).sort((a, b) => a.position - b.position);
        const idx = items.findIndex(item => item.id === id);
        if (idx === -1) return;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= items.length) return;

        let newPos = 1.0;
        if (targetIdx === 0) {
          newPos = items[0].position / 2;
        } else if (targetIdx === items.length - 1) {
          newPos = items[items.length - 1].position + 1.0;
        } else {
          if (direction === 'up') {
            newPos = (items[targetIdx - 1].position + items[targetIdx].position) / 2;
          } else {
            newPos = (items[targetIdx].position + items[targetIdx + 1].position) / 2;
          }
        }
        await reorderPageMutation.mutateAsync({ id, data: { position: newPos } });
        queryClient.invalidateQueries({ queryKey: getPagesQueryKey() });
      }
      toast.success('Ordem atualizada!');
    } catch {
      toast.error('Erro ao reordenar item');
    }
  };

  // =========================================================================
  // MÉTODOS E EVENTOS DO RASTREADOR DE HÁBITOS
  // =========================================================================
  const invalidateTrackerQueries = () => {
    queryClient.invalidateQueries({ queryKey: getTrackerHabitsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getTrackerTodayQueryKey() });
    queryClient.invalidateQueries({ queryKey: getTrackerDaysQueryKey(trackerDateRange) });
    refetchHabits();
    refetchToday();
    refetchDays();
  };

  const handleOpenCreateHabit = () => {
    setEditingHabit(null);
    setHabitName('');
    setHabitIcon('Activity');
    setIsCreateHabitOpen(true);
  };

  const handleOpenEditHabit = (habit: any) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitIcon(habit.icon || 'Activity');
    setIsCreateHabitOpen(true);
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) {
      toast.error('O nome do hábito é obrigatório.');
      return;
    }
    try {
      if (editingHabit) {
        await updateHabitMutation.mutateAsync({
          id: editingHabit.id,
          data: {
            name: habitName.trim(),
            icon: habitIcon,
          }
        });
        toast.success('Hábito atualizado com sucesso!');
      } else {
        await createHabitMutation.mutateAsync({
          data: {
            name: habitName.trim(),
            icon: habitIcon,
          }
        });
        toast.success('Hábito criado com sucesso!');
      }
      setHabitName('');
      setEditingHabit(null);
      setIsCreateHabitOpen(false);
      invalidateTrackerQueries();
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao salvar hábito.');
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await deleteHabitMutation.mutateAsync({ id });
      toast.success('Hábito arquivado com sucesso!');
      invalidateTrackerQueries();
    } catch (err: any) {
      toast.error('Erro ao arquivar hábito.');
    }
  };

  const handleReorderHabit = async (habitId: string, direction: 'up' | 'down') => {
    const list = [...(habitsData?.habits || [])].sort((a: any, b: any) => a.position - b.position);
    const index = list.findIndex((h: any) => h.id === habitId);
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
      const prev = list[index - 1];
      const target = list[index];
      const newPos = index === 1 ? prev.position / 2 : (list[index - 2].position + prev.position) / 2;
      try {
        await reorderHabitMutation.mutateAsync({ id: target.id, data: { position: newPos } });
        invalidateTrackerQueries();
        toast.success('Ordem atualizada!');
      } catch (err: any) {
        toast.error('Erro ao reordenar hábito.');
      }
    } else if (direction === 'down' && index < list.length - 1) {
      const next = list[index + 1];
      const target = list[index];
      const newPos = index === list.length - 2 ? next.position + 1.0 : (next.position + list[index + 2].position) / 2;
      try {
        await reorderHabitMutation.mutateAsync({ id: target.id, data: { position: newPos } });
        invalidateTrackerQueries();
        toast.success('Ordem atualizada!');
      } catch (err: any) {
        toast.error('Erro ao reordenar hábito.');
      }
    }
  };

  const handleToggleHabitRecord = async (habitId: string, date: string, completed: boolean, recordId?: string | null) => {
    try {
      if (completed && recordId) {
        await deleteRecordMutation.mutateAsync({ id: recordId });
        invalidateTrackerQueries();
        toast.success('Registro removido.');
      } else {
        await upsertRecordMutation.mutateAsync({
          data: {
            habitId,
            date,
            completed: true,
          }
        });
        invalidateTrackerQueries();
        toast.success('Registro adicionado!');
      }
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao registrar hábito.');
    }
  };

  const handleOpenDayDetail = (date: string, dayRecord?: any) => {
    setSelectedDayDate(date);
    if (dayRecord) {
      setDayDetailEnergy(dayRecord.energy || null);
      setDayDetailQuality(dayRecord.quality || null);
    } else {
      setDayDetailEnergy(null);
      setDayDetailQuality(null);
    }
    setIsDayDetailModalOpen(true);
  };

  const handleSaveDayDetail = async () => {
    if (!selectedDayDate) return;
    const habits = habitsData?.habits || [];
    if (habits.length === 0) {
      toast.error('Cadastre pelo menos um hábito para salvar detalhes do dia.');
      return;
    }
    
    const targetHabitId = habits[0].id;
    let currentCompleted = false;
    const dayRecord = daysData?.days?.find((d: any) => d.date === selectedDayDate);
    if (dayRecord) {
      const habitRec = dayRecord.habits?.find((h: any) => h.habitId === targetHabitId);
      if (habitRec) {
        currentCompleted = habitRec.completed;
      }
    } else if (selectedDayDate === todayData?.date) {
      const habitRec = todayData?.habits?.find((h: any) => h.habitId === targetHabitId);
      if (habitRec) {
        currentCompleted = habitRec.completed;
      }
    }
    
    try {
      await upsertRecordMutation.mutateAsync({
        data: {
          habitId: targetHabitId,
          date: selectedDayDate,
          completed: currentCompleted,
          energy: dayDetailEnergy || undefined,
          quality: dayDetailQuality || undefined,
        }
      });
      toast.success('Detalhes do dia salvos!');
      setIsDayDetailModalOpen(false);
      invalidateTrackerQueries();
    } catch (err: any) {
      toast.error(err.data?.message || 'Erro ao salvar detalhes.');
    }
  };

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
      
      toast.success('Nota criada com sucesso!');
    } catch (err) {
      toast.error('Erro ao criar nota no servidor.');
    }
  };

  // Exclusão de nota ativa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const handleDeleteNote = () => {
    if (!selectedId) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!selectedId) return;
    
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
      setIsDeleteModalOpen(false);
      toast.success('Nota excluída com sucesso!');
    } catch (err) {
      toast.error('Erro ao deletar nota.');
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
              isFullWidth ? 'hidden' : selectedId ? 'hidden md:flex' : 'flex'
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
              <div className={`flex-1 overflow-y-auto space-y-2 pr-1 pb-24 md:pb-0 transition-opacity duration-200 ${isFetchingList ? 'opacity-65' : 'opacity-100'}`}>
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
                        <span className={`text-sm md:text-base text-[#fafafa] truncate ${isActive ? 'font-medium' : 'font-normal'}`}>
                          {item.title || 'Sem título'}
                        </span>
                        {item.snippet && (
                          <p className="text-xs md:text-sm text-[#a1a1aa] line-clamp-2 leading-relaxed break-all m-0">
                            {item.snippet}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1 shrink-0">
                          <span className="text-[11px] md:text-xs text-[#a1a1aa]/75">
                            {new Date(item.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                          <span className="bg-[#27272a] text-[#a1a1aa] text-[10px] md:text-[11px] px-1.5 py-0.5 rounded-md font-medium shrink-0">
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
                        className="bg-transparent border-0 outline-none text-xl md:text-2xl font-bold text-[#fafafa] placeholder-[#a1a1aa]/30 w-full p-0 focus:ring-0 focus:border-0 truncate"
                      />
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Tag Indicator */}
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#27272a]/40 text-[#a1a1aa]">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-[#6366f1]" />
                        <span className="text-[12px] font-normal">Nota</span>
                      </div>

                      {/* Toggle Full Width */}
                      <button
                        onClick={() => setIsFullWidth((v) => !v)}
                        className="p-1.5 rounded-md hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer shrink-0"
                        title={isFullWidth ? 'Restaurar lista lateral' : 'Expandir editor'}
                        aria-label={isFullWidth ? 'Restaurar lista lateral' : 'Expandir editor'}
                      >
                        {isFullWidth ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </button>

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
                  <div className="flex-1 flex flex-col px-6 py-6 overflow-hidden min-h-0">
                    <textarea
                      ref={contentTextareaRef}
                      value={editorContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onBlur={handleBlur}
                      placeholder="Comece a escrever sua nota aqui..."
                      className="w-full flex-1 bg-transparent border-0 outline-none resize-none text-sm md:text-base text-[#fafafa] placeholder-[#a1a1aa]/30 leading-relaxed p-0 focus:ring-0 overflow-y-auto font-mono"
                    />

                    {/* Status Bar do auto-save */}
                    <div className="mt-4 shrink-0 flex items-center justify-between text-[11px] md:text-xs text-[#a1a1aa]/75 italic select-none">
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
        ) : activeTab === 'tarefas' ? (
          // =========================================================================
          // QUADRO KANBAN (Módulo de Tarefas)
          // =========================================================================
          <div className="flex-1 flex flex-col min-h-0 relative animate-fade-in">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 select-none shrink-0 border-b border-[#27272a]/45 mb-4">
              {/* Search Box */}
              <div className="relative flex items-center gap-2 h-9 bg-[#18181b] border border-[#27272a] px-3 rounded-md w-full sm:w-[240px]">
                <Search className="h-3.5 w-3.5 text-[#a1a1aa] shrink-0" />
                <input
                  placeholder="Buscar tarefas..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs text-[#fafafa] placeholder-[#a1a1aa]/50 w-full p-0 focus:ring-0 focus:border-0 font-mono"
                />
              </div>

              {/* Botão Nova Tarefa */}
              <Button
                onClick={() => handleOpenCreateTask('todo')}
                className="h-9 font-bold bg-[#6366f1] hover:bg-[#6366f1]/95 text-white rounded-md transition-smooth font-mono text-xs flex items-center justify-center gap-1.5 px-4 shadow-md w-full sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova Tarefa
              </Button>
            </div>

            {/* Mobile Column Switcher (Apenas < md) */}
            <div className="flex md:hidden bg-[#18181b] border border-[#27272a] p-1 rounded-lg items-center gap-1 w-full shrink-0 mb-4 select-none">
              {(['todo', 'in_progress', 'done'] as const).map((col) => (
                <button
                  key={col}
                  onClick={() => setActiveMobileColumn(col)}
                  className={`flex-1 py-2 rounded-md text-[11px] font-mono transition-smooth cursor-pointer text-center ${
                    activeMobileColumn === col
                      ? 'bg-[#09090b] border border-[#27272a] text-[#fafafa] font-bold shadow-sm'
                      : 'bg-transparent border border-transparent text-[#a1a1aa] hover:text-[#fafafa] font-semibold'
                  }`}
                >
                  {col === 'todo' && 'A Fazer'}
                  {col === 'in_progress' && 'Em Progresso'}
                  {col === 'done' && 'Concluído'}
                </button>
              ))}
            </div>

            {/* Kanban Columns Grid */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 lg:gap-6 overflow-y-auto md:overflow-y-hidden md:overflow-x-auto pb-24 md:pb-6 min-h-0">
              {(['todo', 'in_progress', 'done'] as const).map((colName) => {
                const colTasks = (tasksData?.tasks || [])
                  .filter((t: any) => t.column === colName)
                  .sort((a: any, b: any) => a.position - b.position);

                return (
                  <div
                    key={colName}
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      const taskId = e.dataTransfer.getData('text/plain');
                      if (!taskId) return;
                      handleMoveTask(taskId, colName);
                    }}
                    className={cn(
                      "w-full md:flex-1 md:min-w-0 flex flex-col bg-[#18181b]/40 border border-[#27272a] rounded-xl p-4 md:max-h-full",
                      activeMobileColumn === colName ? "flex" : "hidden md:flex"
                    )}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#27272a]/60 select-none shrink-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "h-2 w-2 rounded-full",
                          colName === 'todo' ? 'bg-[#6366f1]' :
                          colName === 'in_progress' ? 'bg-amber-400' :
                          'bg-emerald-400'
                        )} />
                        <h3 className="text-xs font-bold font-mono text-[#fafafa] uppercase tracking-wider">
                          {colName === 'todo' ? 'A Fazer' :
                           colName === 'in_progress' ? 'Em Progresso' :
                           'Concluído'}
                        </h3>
                        <span className="text-[10px] bg-[#27272a] text-[#a1a1aa] px-1.5 py-0.5 rounded font-mono font-bold">
                          {colTasks.length}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleOpenCreateTask(colName)}
                        className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                        title="Adicionar tarefa nesta coluna"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Tasks List */}
                    <div className="flex-1 flex flex-col gap-3 mt-3 overflow-y-auto pr-1 min-h-[150px] md:min-h-0">
                      {isFetchingTasks && colTasks.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                      ) : colTasks.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#27272a]/65 rounded-lg bg-transparent min-h-[120px]">
                          <p className="text-[10px] font-mono text-[#a1a1aa] font-semibold">
                            Sem tarefas aqui
                          </p>
                        </div>
                      ) : (
                        colTasks.map((task: any, taskIdx: number) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id, task.column)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const taskId = e.dataTransfer.getData('text/plain');
                              if (!taskId || taskId === task.id) return;
                              handleMoveTask(taskId, colName, taskIdx);
                            }}
                            className={cn(
                              "flex flex-col bg-[#09090b]/80 border border-[#27272a] rounded-lg p-3.5 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-smooth group relative",
                              colName === 'todo' ? 'border-l-3 border-l-[#6366f1]' :
                              colName === 'in_progress' ? 'border-l-3 border-l-amber-500' :
                              'border-l-3 border-l-emerald-500'
                            )}
                          >
                            {/* Title */}
                            <h4 className="text-xs md:text-sm font-bold font-mono text-[#fafafa] leading-snug break-words pr-6 select-text">
                              {task.title}
                            </h4>

                            {/* Description snippet */}
                            {task.description && (
                              <p className="text-[11px] md:text-xs font-mono font-medium text-[#a1a1aa] mt-1.5 leading-normal line-clamp-3 select-text whitespace-pre-wrap">
                                {task.description}
                              </p>
                            )}

                            {/* Footer / Meta & Quick Actions */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#27272a]/40 shrink-0">
                              <span className="text-[10px] md:text-[11px] font-mono text-[#a1a1aa]/60 font-semibold">
                                {new Date(task.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                              </span>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 select-none">
                                {/* Mover para esquerda */}
                                {colName !== 'todo' && (
                                  <button
                                    onClick={() => moveTaskDirectly(task, 'left')}
                                    className="p-1.5 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-primary transition-smooth cursor-pointer"
                                    title="Mover para coluna anterior"
                                  >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                
                                {/* Editar */}
                                <button
                                  onClick={() => handleOpenEditTask(task)}
                                  className="p-1.5 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                                  title="Editar tarefa"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>

                                {/* Deletar */}
                                <button
                                  onClick={() => handleDeleteTaskClick(task)}
                                  className="p-1.5 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-rose-400 transition-smooth cursor-pointer"
                                  title="Excluir tarefa"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>

                                {/* Mover para direita */}
                                {colName !== 'done' && (
                                  <button
                                    onClick={() => moveTaskDirectly(task, 'right')}
                                    className="p-1.5 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-primary transition-smooth cursor-pointer"
                                    title="Mover para próxima coluna"
                                  >
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'estudos' ? (
          // =========================================================================
          // ESTUDOS (Tree Navigation + Study Editor)
          // =========================================================================
          <div className="flex-1 flex flex-col md:flex-row gap-4 lg:gap-6 overflow-y-auto md:overflow-y-hidden h-full relative animate-fade-in min-h-0 pb-24 md:pb-0">

            {/* COLUNA 1: Árvore de Cursos (Tree Column) */}
              <aside className={cn(
                "w-full md:w-[280px] lg:w-[320px] shrink-0 bg-[#18181b]/40 border border-[#27272a] rounded-xl p-4 flex flex-col h-full overflow-hidden select-none",
                selectedPageId ? "hidden md:flex" : "flex"
              )}>
                
                {/* Header da Árvore */}
                <div className="flex items-center justify-between pb-3 border-b border-[#27272a]/60 shrink-0">
                  <div className="space-y-0.5">
                    <h3 className="text-xs md:text-sm font-bold font-mono text-[#fafafa] uppercase tracking-wider">
                      Meus Estudos
                    </h3>
                    <p className="text-[11px] md:text-xs text-[#a1a1aa] font-medium font-mono leading-none">
                      Cursos e páginas
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreateCourse}
                    className="p-1 rounded hover:bg-[#27272a] text-primary hover:text-primary-foreground transition-smooth cursor-pointer flex items-center gap-1 text-xs font-mono font-bold"
                    title="Novo Curso"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Course Selector Dropdown (Pencil node bUOEG / Su2uD) */}
                <div className="relative shrink-0 mt-3 select-none">
                  <button
                    onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                    className="w-full h-11 flex items-center justify-between px-3.5 rounded-lg border border-[#27272a] bg-[#18181b]/60 hover:bg-[#18181b] hover:border-[#6366f1]/40 transition-smooth text-[#fafafa] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BookOpen className="h-4 w-4 text-[#6366f1] shrink-0" />
                      <span className="text-xs md:text-sm font-bold font-mono truncate">
                        {selectedCourse?.name || 'Selecionar Curso'}
                      </span>
                    </div>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-[#a1a1aa] shrink-0 transition-transform duration-200", isCourseDropdownOpen && "transform rotate-180")} />
                  </button>

                  {isCourseDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1.5 bg-[#18181b] border border-[#27272a] rounded-lg shadow-2xl p-1 animate-fade-in max-h-[220px] overflow-y-auto">
                      {(coursesData?.courses || []).length === 0 ? (
                        <div className="py-3 px-2 text-center">
                          <p className="text-[10px] font-mono text-[#a1a1aa]">Nenhum curso encontrado</p>
                        </div>
                      ) : (
                        [...(coursesData?.courses || [])]
                          .sort((a: any, b: any) => a.position - b.position)
                          .map((c: any) => (
                            <div
                              key={c.id}
                              className={cn(
                                "flex items-center justify-between px-2.5 py-1.5 rounded-md text-left cursor-pointer group/item transition-smooth",
                                selectedCourseId === c.id 
                                  ? "bg-[#6366f1]/15 text-[#fafafa] font-bold" 
                                  : "hover:bg-[#27272a]/50 text-[#a1a1aa] hover:text-[#fafafa]"
                              )}
                            >
                              <div 
                                onClick={() => {
                                  setSelectedCourseId(c.id);
                                  setIsCourseDropdownOpen(false);
                                }}
                                className="flex items-center gap-2 min-w-0 flex-1 py-0.5"
                              >
                                <BookOpen className="h-3.5 w-3.5 text-[#6366f1] shrink-0" />
                                <span className="text-xs md:text-sm font-mono truncate">{c.name}</span>
                              </div>
                              
                              {/* Ações do Curso dentro do Dropdown */}
                              <div className="hidden group-hover/item:flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditCourse(c);
                                    setIsCourseDropdownOpen(false);
                                  }}
                                  className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]"
                                  title="Editar Curso"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteStudyClick('course', c.id, c.name);
                                    setIsCourseDropdownOpen(false);
                                  }}
                                  className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-rose-400"
                                  title="Excluir Curso"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                      <div className="border-t border-[#27272a]/60 my-1" />
                      <button
                        onClick={() => {
                          handleOpenCreateCourse();
                          setIsCourseDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs md:text-sm font-bold font-mono text-[#6366f1] hover:bg-[#6366f1]/10 rounded-md transition-smooth"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Criar Novo Curso
                      </button>
                    </div>
                  )}
                </div>

                {/* Tree Container */}
                <div className="flex-1 overflow-y-auto mt-3 pr-1 flex flex-col min-h-0">
                  {!selectedCourseId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#27272a]/65 rounded-lg">
                      <p className="text-[11px] md:text-xs font-mono text-[#a1a1aa] font-semibold leading-normal">
                        Crie ou selecione um curso para ver seus módulos e páginas.
                      </p>
                      <Button
                        onClick={handleOpenCreateCourse}
                        className="h-7 mt-3 font-mono text-[11px] md:text-xs font-bold bg-[#6366f1] text-white px-3"
                      >
                        Criar Curso
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Section Header: MÓDULOS */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#27272a]/30 shrink-0">
                        <span className="text-xs font-bold font-mono text-[#a1a1aa] uppercase tracking-wider">
                          MÓDULOS
                        </span>
                        <button
                          onClick={() => handleOpenCreateModule(selectedCourseId)}
                          className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-primary transition-smooth cursor-pointer flex items-center gap-1 text-xs font-mono font-bold"
                          title="Adicionar Módulo"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-0.5">
                        {courseModules.length === 0 ? (
                          <div className="flex flex-col items-center justify-center text-center py-8 px-4 border border-dashed border-[#27272a]/40 rounded-lg">
                            <p className="text-[11px] md:text-xs font-mono text-[#a1a1aa]/70 leading-normal">
                              Nenhum módulo cadastrado neste curso
                            </p>
                            <Button
                              onClick={() => handleOpenCreateModule(selectedCourseId)}
                              className="h-6 mt-2 font-mono text-[10px] md:text-[11px] font-bold bg-[#6366f1]/90 hover:bg-[#6366f1] text-white px-2.5"
                            >
                              Criar Módulo
                            </Button>
                          </div>
                        ) : (
                          courseModules.map((module: any, modIdx: number, modArr: any[]) => {
                            const isModExpanded = !!expandedModules[module.id];
                            const modulePages = (pagesData?.pages || [])
                              .filter((p: any) => p.moduleId === module.id)
                              .sort((a: any, b: any) => a.position - b.position);

                            return (
                              <div key={module.id} className="space-y-1">
                                {/* Module Row */}
                                <div className={cn(
                                  "flex items-center justify-between p-1.5 rounded-lg border transition-smooth group/mod",
                                  isModExpanded 
                                    ? "bg-[#18181b]/60 border-[#27272a]" 
                                    : "bg-[#18181b]/30 border-[#27272a]/20 hover:border-primary/30"
                                )}>
                                  <div
                                    onClick={() => toggleModuleExpanded(module.id)}
                                    className="flex items-center gap-1.5 cursor-pointer min-w-0 flex-1 pr-2"
                                  >
                                    {isModExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-[#a1a1aa] shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 text-[#a1a1aa] shrink-0" />
                                    )}
                                    <Folder className={cn("h-3.5 w-3.5 shrink-0", isModExpanded ? "text-[#6366f1]" : "text-amber-400/80")} />
                                    <span className="text-xs md:text-sm font-mono font-semibold text-[#fafafa] truncate">
                                      {module.name}
                                    </span>
                                  </div>

                                  {/* Actions */}
                                  <div className="hidden group-hover/mod:flex items-center gap-0.5 shrink-0">
                                    {modIdx > 0 && (
                                      <button
                                        onClick={() => handleReorderStudyItem('module', module.id, 'up')}
                                        className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa]"
                                        title="Mover para cima"
                                      >
                                        <ArrowUp className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    {modIdx < modArr.length - 1 && (
                                      <button
                                        onClick={() => handleReorderStudyItem('module', module.id, 'down')}
                                        className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa]"
                                        title="Mover para baixo"
                                      >
                                        <ArrowDown className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleOpenCreatePage(module.id)}
                                      className="p-1 rounded hover:bg-[#27272a] text-primary"
                                      title="Adicionar Página"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenEditModule(module)}
                                      className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa]"
                                      title="Editar Módulo"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudyClick('module', module.id, module.name)}
                                      className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-rose-400"
                                      title="Excluir Módulo"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Pages (Children of Module) */}
                                {isModExpanded && (
                                  <div className="pl-4 border-l border-[#27272a]/40 ml-3.5 space-y-1 py-0.5">
                                    {modulePages.length === 0 ? (
                                      <p className="text-[10px] md:text-xs text-[#a1a1aa]/50 italic font-mono pl-3 py-1">
                                        Sem páginas
                                      </p>
                                    ) : (
                                      modulePages.map((page: any, pageIdx: number, pageArr: any[]) => {
                                        const isActive = selectedPageId === page.id;

                                        return (
                                          <div
                                            key={page.id}
                                            className={cn(
                                              "flex items-center justify-between p-1 rounded-md transition-smooth group/page pl-2",
                                              isActive 
                                                ? "bg-primary/15 border border-primary/25 text-[#fafafa] font-bold" 
                                                : "hover:bg-[#18181b]/40 text-[#a1a1aa] hover:text-[#fafafa] border border-transparent"
                                            )}
                                          >
                                            <div
                                              onClick={() => setSelectedPageId(page.id)}
                                              className="flex items-center gap-1.5 cursor-pointer min-w-0 flex-1 pr-2 py-0.5"
                                            >
                                              <FileText className={cn("h-3 w-3 shrink-0", isActive ? "text-[#6366f1]" : "text-emerald-400/80")} />
                                              <span className="text-xs md:text-sm font-mono truncate leading-none">
                                                {page.title}
                                              </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="hidden group-hover/page:flex items-center gap-0.5 shrink-0 pr-1">
                                              {pageIdx > 0 && (
                                                <button
                                                  onClick={() => handleReorderStudyItem('page', page.id, 'up')}
                                                  className="p-1 rounded hover:bg-[#27272a]"
                                                  title="Mover para cima"
                                                >
                                                  <ArrowUp className="h-3.5 w-3.5" />
                                                </button>
                                              )}
                                              {pageIdx < pageArr.length - 1 && (
                                                <button
                                                  onClick={() => handleReorderStudyItem('page', page.id, 'down')}
                                                  className="p-1 rounded hover:bg-[#27272a]"
                                                  title="Mover para baixo"
                                                >
                                                  <ArrowDown className="h-3.5 w-3.5" />
                                                </button>
                                              )}
                                              <button
                                                onClick={() => handleDeleteStudyClick('page', page.id, page.title)}
                                                className="p-1 rounded hover:bg-[#27272a] hover:text-rose-400"
                                                title="Excluir Página"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              </aside>

            {/* COLUNA 2: Editor de Estudos (Study Editor) */}
            <section className={cn(
              "flex-1 flex flex-col bg-[#18181b]/30 border border-[#27272a] rounded-xl overflow-hidden h-full",
              selectedPageId ? "flex" : "hidden md:flex"
            )}>
              {selectedPageId ? (
                <div className="flex-1 flex flex-col overflow-hidden animate-fade-in h-full">
                  
                  {/* Breadcrumbs & Status Bar */}
                  <div className="px-6 pt-5 shrink-0 flex items-center justify-between select-none">
                    <div className="flex items-center gap-1 text-xs md:text-sm font-mono text-[#a1a1aa] font-bold min-w-0 flex-1 mr-4">
                      {/* Botão de Voltar para Mobile */}
                      <button
                        onClick={() => setSelectedPageId(undefined)}
                        className="md:hidden flex items-center gap-0.5 text-xs text-[#a1a1aa] hover:text-[#fafafa] font-bold font-mono mr-1.5 shrink-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Voltar
                      </button>
                      <span className="truncate max-w-[50px] md:max-w-[100px]">Estudos</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#a1a1aa]/60 shrink-0" />
                      <span className="truncate max-w-[80px] md:max-w-[120px]">{pageDetailData?.breadcrumbs?.course?.name || selectedCourse?.name}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#a1a1aa]/60 shrink-0" />
                      <span className="truncate max-w-[80px] md:max-w-[120px]">{pageDetailData?.breadcrumbs?.module?.name}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#a1a1aa]/60 shrink-0" />
                      <span className="text-[#fafafa] truncate max-w-[80px] md:max-w-[120px]">{pageDetailData?.breadcrumbs?.page?.name || studyEditorTitle}</span>
                    </div>

                    {/* Status Bar */}
                    <div className="text-[11px] md:text-xs font-mono italic text-[#a1a1aa]/65 font-bold shrink-0 pr-2">
                      {studySaveStatus === 'saved' && <span>Salvo automaticamente</span>}
                      {studySaveStatus === 'typing' && <span className="text-amber-400 animate-pulse">Digitando...</span>}
                      {studySaveStatus === 'saving' && (
                        <span className="text-[#6366f1] flex items-center gap-1 font-bold">
                          <Loader2 className="h-3 w-3 animate-spin inline" /> Salvando...
                        </span>
                      )}
                      {studySaveStatus === 'error' && (
                        <span className="text-rose-400 flex items-center gap-1 font-bold">
                          <AlertCircle className="h-3 w-3 inline" /> Erro ao salvar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title input */}
                  <div className="px-6 pt-3.5 shrink-0 flex items-center justify-between gap-4">
                    <input
                      type="text"
                      value={studyEditorTitle}
                      onChange={(e) => handleStudyTitleChange(e.target.value)}
                      onBlur={handleStudyBlur}
                      placeholder="Sem título"
                      className="flex-1 bg-transparent border-0 outline-none text-xl md:text-2xl font-bold font-mono text-[#fafafa] placeholder-[#a1a1aa]/20 p-0 focus:ring-0 focus:border-0"
                    />
                    <button
                      onClick={() => handleDeleteStudyClick('page', selectedPageId, pageDetailData?.page?.title || '')}
                      className="p-1.5 rounded hover:bg-[#27272a] text-[#f43f5e] hover:text-rose-400 transition-smooth shrink-0"
                      title="Excluir Página"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Line Divider */}
                  <div className="h-px bg-[#27272a]/60 mx-6 mt-4 shrink-0" />

                  {/* Markdown Content Textarea */}
                  <div className="flex-1 flex flex-col px-6 py-5 overflow-hidden">
                    <textarea
                      value={studyEditorContent}
                      onChange={(e) => handleStudyContentChange(e.target.value)}
                      onBlur={handleStudyBlur}
                      placeholder="Escreva suas anotações e conteúdos usando Markdown..."
                      className="w-full flex-1 bg-transparent border-0 outline-none resize-none text-sm md:text-base text-[#fafafa] placeholder-[#a1a1aa]/20 leading-relaxed p-0 focus:ring-0 overflow-y-auto font-mono"
                    />
                    <div className="flex items-center justify-between shrink-0 pt-2 select-none">
                      <span className="text-[11px] md:text-xs font-mono text-[#a1a1aa]/45">
                        Salvo automaticamente na pasta de Estudos
                      </span>
                      <span className="text-[11px] md:text-xs font-mono text-[#a1a1aa]/40">
                        Markdown suportado
                      </span>
                    </div>
                  </div>

                </div>
              ) : (
                // Placeholder
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-transparent animate-fade-in">
                  <div className="flex h-12 w-12 rounded-xl bg-[#09090b] border border-[#27272a] items-center justify-center text-[#a1a1aa] mb-4">
                    <BookOpen className="h-5.5 w-5.5 text-primary" />
                  </div>
                  <h3 className="text-[13px] font-medium text-[#fafafa] uppercase tracking-wider font-mono">
                    Editor de Estudos
                  </h3>
                  <p className="text-[11px] text-[#a1a1aa] max-w-[250px] mt-2 leading-relaxed font-normal font-mono">
                    Selecione uma página na lista ao lado ou crie uma nova sob algum módulo para começar a escrever seu conhecimento.
                  </p>
                </div>
              )}
            </section>

          </div>
        ) : (
          // =========================================================================
          // ABA RASTREADOR DE HÁBITOS (Rastreador de Hábitos MVP)
          // =========================================================================
          <div className="flex-1 flex flex-col bg-[#18181b]/35 border border-[#27272a] rounded-xl h-full overflow-hidden animate-fade-in font-mono">
            {/* Header do Sub-módulo */}
            <div className="p-5 border-b border-[#27272a]/60 bg-[#18181b]/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 select-none">
              <div>
                <h3 className="text-[13px] font-bold text-[#fafafa] uppercase tracking-wider">
                  Rastreador de Hábitos
                </h3>
                <p className="text-[11px] text-[#a1a1aa] mt-1">
                  Monitore suas rotinas e registre sua performance diária
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsHabitManagerOpen(true)}
                  className="h-8.5 text-xs font-bold bg-transparent border border-[#27272a] hover:bg-[#27272a] text-[#fafafa] font-mono px-3 cursor-pointer"
                >
                  <LucideIcons.Settings className="h-3.5 w-3.5 mr-1.5" />
                  Gerenciar Hábitos
                </Button>
                <Button
                  onClick={handleOpenCreateHabit}
                  className="h-8.5 text-xs font-bold bg-[#6366f1] hover:bg-[#6366f1]/90 text-white font-mono px-3 cursor-pointer"
                >
                  <LucideIcons.Plus className="h-3.5 w-3.5 mr-1.5" />
                  Novo Hábito
                </Button>
              </div>
            </div>

            {/* Conteúdo Principal */}
            {habitsData?.habits && habitsData.habits.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-transparent animate-fade-in select-none">
                <div className="flex h-14 w-14 rounded-2xl bg-[#09090b] border border-[#27272a] items-center justify-center text-[#a1a1aa] mb-4 shadow-xl">
                  <CalendarDays className="h-7 w-7 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-[#fafafa] uppercase tracking-wider">
                  Nenhum Hábito Cadastrado
                </h4>
                <p className="text-xs text-[#a1a1aa] max-w-[280px] mt-2 leading-relaxed">
                  Comece cadastrando hábitos saudáveis (ex: Beber Água, Exercício, Leitura) para acompanhar seu progresso diário.
                </p>
                <Button
                  onClick={handleOpenCreateHabit}
                  className="h-9 mt-4 text-xs font-bold bg-[#6366f1] hover:bg-[#6366f1]/90 text-white px-4 cursor-pointer"
                >
                  Cadastrar Meu Primeiro Hábito
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 1. VISUALIZAÇÃO DESKTOP / TABLET (Tabela de Hábitos) */}
                <div className="hidden md:flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-auto animate-fade-in">
                    <table className="w-full border-collapse text-[11px] font-mono text-left">
                      <thead>
                        <tr className="border-b border-[#27272a] bg-[#18181b]/50 select-none text-[#fafafa] font-bold">
                            <th className="p-3.5 border-r border-[#27272a]/60">Dia</th>
                            {habitsData?.habits?.map((h: any) => (
                              <th key={h.id} className="p-3.5 border-r border-[#27272a]/60 min-w-[100px] max-w-[140px] truncate text-center">
                                <div className="flex flex-col items-center gap-1.5">
                                  <HabitIconHelper name={h.icon} className="h-4 w-4 text-emerald-400" />
                                  <span className="truncate w-full">{h.name}</span>
                                </div>
                              </th>
                            ))}
                            <th className="p-3.5 border-r border-[#27272a]/60 text-center min-w-[90px]">Energia</th>
                            <th className="p-3.5 border-r border-[#27272a]/60 text-center min-w-[80px]">Pontos</th>
                            <th className="p-3.5 border-r border-[#27272a]/60 text-center min-w-[95px]">Qualidade</th>
                            <th className="p-3.5 text-center min-w-[60px]">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedDates.map((dateStr) => {
                            const dayRecord = daysData?.days?.find((d: any) => d.date === dateStr);
                            
                            // Formatação legível do dia
                            const parsedDate = new Date(dateStr + 'T12:00:00');
                            const rawWeekday = parsedDate.toLocaleDateString('pt-BR', { weekday: 'long' });
                            const weekday = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1);
                            const dayAndMonth = parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                            const isToday = dateStr === todayData?.date;

                          // Calcula pontuação
                          const totalHabits = habitsData?.habits?.length || 0;
                          let completedCount = 0;
                          
                          return (
                            <tr
                              key={dateStr}
                              className={cn(
                                "border-b border-[#27272a]/60 transition-colors",
                                isToday ? "bg-[#6366f1]/5 hover:bg-[#6366f1]/10" : "hover:bg-[#18181b]/15"
                              )}
                            >
                              {/* Data */}
                              <td className="p-3 border-r border-[#27272a]/60 font-bold whitespace-nowrap">
                                <span className={cn("text-xs font-mono", isToday && "text-[#6366f1] font-extrabold")}>
                                  {isToday ? 'Hoje' : `${weekday}, ${dayAndMonth}`}
                                </span>
                              </td>

                              {/* Checkboxes de Hábitos */}
                              {habitsData?.habits?.map((h: any) => {
                                const matchedHabit = dayRecord?.habits?.find((hr: any) => hr.habitId === h.id) || 
                                                     (isToday ? todayData?.habits?.find((hr: any) => hr.habitId === h.id) : null);
                                const isCompleted = matchedHabit?.completed || false;
                                const recordId = matchedHabit?.recordId || null;
                                if (isCompleted) completedCount++;

                                return (
                                  <td key={h.id} className="p-3 border-r border-[#27272a]/60 text-center">
                                    <div className="flex justify-center">
                                      <button
                                        onClick={() => handleToggleHabitRecord(h.id, dateStr, isCompleted, recordId)}
                                        className={cn(
                                          "h-5 w-5 rounded-md border flex items-center justify-center transition-smooth cursor-pointer",
                                          isCompleted 
                                            ? "bg-emerald-500 border-emerald-600 text-[#09090b]" 
                                            : "border-[#27272a] hover:border-emerald-500/50 bg-[#09090b]/40 text-transparent"
                                        )}
                                      >
                                        <LucideIcons.Check className="h-3.5 w-3.5 stroke-[3px]" />
                                      </button>
                                    </div>
                                  </td>
                                );
                              })}

                              {/* Energia */}
                              <td className="p-3 border-r border-[#27272a]/60 text-center select-none">
                                {dayRecord?.energy ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border uppercase",
                                    dayRecord.energy === 'low' && "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/20",
                                    dayRecord.energy === 'medium' && "text-amber-400 bg-amber-400/10 border-amber-400/20",
                                    dayRecord.energy === 'high' && "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                                  )}>
                                    {dayRecord.energy === 'low' ? 'Baixa' : dayRecord.energy === 'medium' ? 'Média' : 'Alta'}
                                  </span>
                                ) : (
                                  <span className="text-[#a1a1aa]/30">-</span>
                                )}
                              </td>

                              {/* Pontuação */}
                              <td className="p-3 border-r border-[#27272a]/60 text-center select-none font-bold">
                                <span className={cn(
                                  completedCount === totalHabits && totalHabits > 0 ? "text-emerald-400" : "text-[#fafafa]/80"
                                )}>
                                  {completedCount}/{totalHabits}
                                </span>
                              </td>

                              {/* Qualidade */}
                              <td className="p-3 border-r border-[#27272a]/60 text-center select-none">
                                {dayRecord?.quality ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border uppercase",
                                    dayRecord.quality === 'weak' && "text-rose-400 bg-rose-400/10 border-rose-400/25",
                                    dayRecord.quality === 'ok' && "text-amber-400 bg-amber-400/10 border-amber-400/25",
                                    dayRecord.quality === 'strong' && "text-emerald-400 bg-emerald-400/10 border-emerald-400/25"
                                  )}>
                                    {dayRecord.quality === 'weak' ? 'Ruim' : dayRecord.quality === 'ok' ? 'Ok' : 'Ótima'}
                                  </span>
                                ) : (
                                  <span className="text-[#a1a1aa]/30">-</span>
                                )}
                              </td>

                              {/* Ações (Editar detalhes do dia) */}
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenDayDetail(dateStr, dayRecord)}
                                    className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-smooth cursor-pointer"
                                    title="Editar observações e detalhes do dia"
                                  >
                                    <LucideIcons.Edit className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. VISUALIZAÇÃO MOBILE (Card de Dia + Checklist) */}
                <div className="flex md:hidden flex-col flex-1 px-4 pt-4 pb-28 overflow-y-auto space-y-4">
                  {/* Selector de Data Mobile */}
                  <div className="flex items-center justify-between bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 select-none">
                    <button
                      onClick={() => {
                        const cur = new Date(selectedMobileDate + 'T12:00:00');
                        cur.setDate(cur.getDate() - 1);
                        const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        setSelectedMobileDate(format(cur));
                      }}
                      className="p-1 rounded hover:bg-[#27272a] text-[#fafafa] cursor-pointer"
                    >
                      <LucideIcons.ChevronLeft className="h-4.5 w-4.5" />
                    </button>
                    <div className="text-center font-mono">
                      <span className="text-xs font-bold text-[#fafafa] block">
                        {selectedMobileDate === todayData?.date ? 'Hoje' : (() => {
                          const parsed = new Date(selectedMobileDate + 'T12:00:00');
                          const rawW = parsed.toLocaleDateString('pt-BR', { weekday: 'long' });
                          const w = rawW.charAt(0).toUpperCase() + rawW.slice(1);
                          const dm = parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                          return `${w}, ${dm}`;
                        })()}
                      </span>
                      <span className="block text-[9px] text-[#a1a1aa] font-semibold">{selectedMobileDate}</span>
                    </div>
                    <button
                      disabled={selectedMobileDate === todayData?.date}
                      onClick={() => {
                        const cur = new Date(selectedMobileDate + 'T12:00:00');
                        cur.setDate(cur.getDate() + 1);
                        const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        setSelectedMobileDate(format(cur));
                      }}
                      className="p-1 rounded hover:bg-[#27272a] text-[#fafafa] disabled:opacity-30 cursor-pointer"
                    >
                      <LucideIcons.ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Detalhes do Registro para o Dia Selecionado */}
                  {(() => {
                    const dayRecord = daysData?.days?.find((d: any) => d.date === selectedMobileDate) || 
                                       (selectedMobileDate === todayData?.date ? todayData : null);

                    const totalHabits = habitsData?.habits?.length || 0;
                    let completedCount = 0;
                    habitsData?.habits?.forEach((h: any) => {
                      const matched = dayRecord?.habits?.find((hr: any) => hr.habitId === h.id);
                      if (matched?.completed) completedCount++;
                    });

                    const progressPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

                    return (
                      <div className="space-y-4">
                        {/* Summary Card */}
                        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <LucideIcons.Trophy className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-[#fafafa] block">Pontuação do Dia</span>
                                <span className="text-[10px] text-[#a1a1aa] font-semibold">{completedCount} de {totalHabits} hábitos</span>
                              </div>
                            </div>
                            <span className="text-lg font-black text-emerald-400 font-mono">{progressPercent}%</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-[#09090b] rounded-full h-2 overflow-hidden border border-[#27272a]/40">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>

                          {/* Badges de Qualidade e Energia */}
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <button
                              onClick={() => handleOpenDayDetail(selectedMobileDate, dayRecord)}
                              className="bg-[#09090b]/50 border border-[#27272a] rounded-lg p-2 text-left hover:bg-[#27272a]/30 transition-smooth cursor-pointer"
                            >
                              <span className="text-[9px] text-[#a1a1aa] block font-semibold">ENERGIA</span>
                              <span className="text-[#fafafa] font-bold">
                                {dayRecord?.energy === 'low' && 'Baixa'}
                                {dayRecord?.energy === 'medium' && 'Média'}
                                {dayRecord?.energy === 'high' && 'Alta'}
                                {!dayRecord?.energy && 'Definir...'}
                              </span>
                            </button>
                            <button
                              onClick={() => handleOpenDayDetail(selectedMobileDate, dayRecord)}
                              className="bg-[#09090b]/50 border border-[#27272a] rounded-lg p-2 text-left hover:bg-[#27272a]/30 transition-smooth cursor-pointer"
                            >
                              <span className="text-[9px] text-[#a1a1aa] block font-semibold">QUALIDADE</span>
                              <span className="text-[#fafafa] font-bold">
                                {dayRecord?.quality === 'weak' && 'Ruim'}
                                {dayRecord?.quality === 'ok' && 'Ok'}
                                {dayRecord?.quality === 'strong' && 'Ótima'}
                                {!dayRecord?.quality && 'Definir...'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Habits Checklist */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider block">Lista de Hábitos</span>
                          <div className="space-y-1.5">
                            {habitsData?.habits?.map((h: any) => {
                              const matchedHabit = dayRecord?.habits?.find((hr: any) => hr.habitId === h.id);
                              const isCompleted = matchedHabit?.completed || false;
                              const recordId = matchedHabit?.recordId || null;

                              return (
                                <div
                                  key={h.id}
                                  onClick={() => handleToggleHabitRecord(h.id, selectedMobileDate, isCompleted, recordId)}
                                  className={cn(
                                    "flex items-center justify-between p-3.5 border rounded-lg transition-smooth cursor-pointer select-none",
                                    isCompleted 
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-[#fafafa] font-bold" 
                                      : "bg-[#18181b]/30 border-[#27272a] text-[#a1a1aa] hover:border-[#27272a]"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <HabitIconHelper name={h.icon} className={cn("h-4.5 w-4.5", isCompleted ? "text-emerald-400" : "text-[#a1a1aa]")} />
                                    <span className="text-xs">{h.name}</span>
                                  </div>
                                  <div className={cn(
                                    "h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center transition-smooth",
                                    isCompleted 
                                      ? "bg-emerald-500 border-emerald-600 text-[#09090b]" 
                                      : "border-[#27272a]"
                                  )}>
                                    <LucideIcons.Check className={cn("h-3 w-3 stroke-[3px]", isCompleted ? "block" : "hidden")} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteNote}
        title="Excluir Nota"
        description="Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita."
        isLoading={deleteMutation.isPending}
      />

      {/* Modal de Criar/Editar Tarefa */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-[450px] bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-sm">
            <form onSubmit={handleSaveTask}>
              {/* Header */}
              <div className="p-6 pb-4 border-b border-[#27272a]/60">
                <h3 className="text-base font-bold text-[#fafafa]">
                  {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h3>
                <p className="text-xs text-[#a1a1aa] mt-1 font-semibold">
                  Preencha os dados da tarefa abaixo
                </p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {taskFormError && (
                  <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span className="font-semibold">{taskFormError}</span>
                  </div>
                )}

                {/* Título */}
                <div className="space-y-1.5">
                  <label htmlFor="task-title" className="text-xs font-bold text-[#a1a1aa] uppercase">
                    Título
                  </label>
                  <Input
                    id="task-title"
                    placeholder="Ex: Comprar mantimentos"
                    value={taskFormTitle}
                    onChange={(e) => setTaskFormTitle(e.target.value)}
                    maxLength={200}
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                    required
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label htmlFor="task-desc" className="text-xs font-bold text-[#a1a1aa] uppercase">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    id="task-desc"
                    placeholder="Adicione detalhes sobre a tarefa..."
                    value={taskFormDescription}
                    onChange={(e) => setTaskFormDescription(e.target.value)}
                    maxLength={2000}
                    className="w-full min-h-[100px] max-h-[200px] rounded-md border border-[#27272a] bg-[#09090b] px-3 py-2 text-xs shadow-sm transition-all placeholder:text-[#a1a1aa]/30 focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1]/50 text-[#fafafa] font-mono leading-relaxed"
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  />
                </div>

                {/* Coluna */}
                <div className="space-y-1.5">
                  <label htmlFor="task-col" className="text-xs font-bold text-[#a1a1aa] uppercase">
                    Coluna
                  </label>
                  <select
                    id="task-col"
                    value={taskFormColumn}
                    onChange={(e: any) => setTaskFormColumn(e.target.value)}
                    className="w-full h-9 rounded-md border border-[#27272a] bg-[#09090b] px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1]/50 text-[#fafafa] font-mono cursor-pointer"
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  >
                    <option value="todo">A Fazer</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="done">Concluído</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 p-4 border-t border-[#27272a] bg-[#09090b]">
                <Button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  variant="outline"
                  className="flex-1 h-10 font-bold border border-[#27272a] bg-transparent text-[#fafafa] hover:bg-[#27272a] rounded-md transition-smooth font-mono text-xs"
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 font-bold bg-[#6366f1] hover:bg-[#6366f1]/90 text-white rounded-md transition-smooth font-mono text-xs"
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                >
                  {createTaskMutation.isPending || updateTaskMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ConfirmModal para Excluir Tarefa */}
      <ConfirmModal
        isOpen={isTaskDeleteModalOpen}
        onClose={() => setIsTaskDeleteModalOpen(false)}
        onConfirm={confirmDeleteTask}
        title="Excluir Tarefa"
        description="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
        isLoading={deleteTaskMutation.isPending}
      />

      {/* Modal - Curso */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-[400px] bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-sm">
            <form onSubmit={handleSaveCourse}>
              <div className="p-6 pb-4 border-b border-[#27272a]/60">
                <h3 className="text-base font-bold text-[#fafafa]">
                  {editingCourse ? 'Editar Curso' : 'Novo Curso'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="course-name" className="text-xs font-bold text-[#a1a1aa] uppercase">
                    Nome do Curso
                  </label>
                  <Input
                    id="course-name"
                    placeholder="Ex: React Native"
                    value={courseFormName}
                    onChange={(e) => setCourseFormName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-[#27272a] bg-[#09090b]">
                <Button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  variant="outline"
                  className="flex-1 h-10 font-bold border border-[#27272a] bg-transparent text-[#fafafa] hover:bg-[#27272a] rounded-md transition-smooth font-mono text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 font-bold bg-[#6366f1] hover:bg-[#6366f1]/90 text-white rounded-md transition-smooth font-mono text-xs"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Módulo */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-[400px] bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-sm">
            <form onSubmit={handleSaveModule}>
              <div className="p-6 pb-4 border-b border-[#27272a]/60">
                <h3 className="text-base font-bold text-[#fafafa]">
                  {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="module-name" className="text-xs font-bold text-[#a1a1aa] uppercase">
                    Nome do Módulo
                  </label>
                  <Input
                    id="module-name"
                    placeholder="Ex: 1 - Introdução ao Framework"
                    value={moduleFormName}
                    onChange={(e) => setModuleFormName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-[#27272a] bg-[#09090b]">
                <Button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  variant="outline"
                  className="flex-1 h-10 font-bold border border-[#27272a] bg-transparent text-[#fafafa] hover:bg-[#27272a] rounded-md transition-smooth font-mono text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 font-bold bg-[#6366f1] hover:bg-[#6366f1]/90 text-white rounded-md transition-smooth font-mono text-xs"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Página */}
      {isPageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in">
          <div className="w-full max-w-[400px] bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-sm">
            <form onSubmit={handleSavePage}>
              <div className="p-6 pb-4 border-b border-[#27272a]/60">
                <h3 className="text-base font-bold text-[#fafafa]">
                  {editingPage ? 'Editar Página' : 'Nova Página'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="page-title" className="text-xs font-bold text-[#a1a1aa] uppercase">
                    Título da Página
                  </label>
                  <Input
                    id="page-title"
                    placeholder="Ex: Anotações da Aula"
                    value={pageFormTitle}
                    onChange={(e) => setPageFormTitle(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-[#27272a] bg-[#09090b]">
                <Button
                  type="button"
                  onClick={() => setIsPageModalOpen(false)}
                  variant="outline"
                  className="flex-1 h-10 font-bold border border-[#27272a] bg-transparent text-[#fafafa] hover:bg-[#27272a] rounded-md transition-smooth font-mono text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 font-bold bg-[#6366f1] hover:bg-[#6366f1]/90 text-white rounded-md transition-smooth font-mono text-xs"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ConfirmModal para Deletar Item de Estudos */}
      <ConfirmModal
        isOpen={isStudyDeleteModalOpen}
        onClose={() => setIsStudyDeleteModalOpen(false)}
        onConfirm={confirmDeleteStudy}
        title={`Excluir ${studyDeleteTarget?.type === 'course' ? 'Curso' : studyDeleteTarget?.type === 'module' ? 'Módulo' : 'Página'}`}
        description={`Tem certeza que deseja excluir "${studyDeleteTarget?.name}"? Esta ação removerá em cascata todos os itens filhos vinculados e não poderá ser desfeita.`}
        isLoading={
          deleteCourseMutation.isPending || 
          deleteModuleMutation.isPending || 
          deletePageMutation.isPending
        }
      />

      {/* Modal - Gerenciar Hábitos */}
      {isHabitManagerOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in select-none"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsHabitManagerOpen(false);
            }
          }}
        >
          <div className="w-full max-w-[480px] bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-sm max-h-[85vh]">
            {/* Header */}
            <div className="p-5 pb-4 border-b border-[#27272a]/60 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#fafafa] uppercase tracking-wider">
                  Gerenciar Meus Hábitos
                </h3>
                <p className="text-[11px] text-[#a1a1aa] mt-0.5">
                  Cadastre, edite e reordene seus hábitos diários (máximo 20)
                </p>
              </div>
              <button
                onClick={() => setIsHabitManagerOpen(false)}
                className="p-1 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] outline-none"
                aria-label="Fechar gerenciador de hábitos"
              >
                <LucideIcons.X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-[#a1a1aa] uppercase">
                  Total: {habitsData?.habits?.length || 0}/20
                </span>
                <Button
                  onClick={handleOpenCreateHabit}
                  disabled={(habitsData?.habits?.length || 0) >= 20}
                  className="h-8 text-[11px] font-bold bg-[#6366f1] hover:bg-[#6366f1]/90 text-white font-mono px-3.5 cursor-pointer disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
                >
                  <LucideIcons.Plus className="h-3.5 w-3.5 mr-1" />
                  Criar Hábito
                </Button>
              </div>

              {/* Lista de Hábitos */}
              <div className="space-y-1.5">
                {!habitsData?.habits || habitsData.habits.length === 0 ? (
                  <p className="text-center py-8 text-xs text-[#a1a1aa]/45 italic">
                    Nenhum hábito cadastrado ainda.
                  </p>
                ) : (
                  [...(habitsData.habits)].sort((a: any, b: any) => a.position - b.position).map((habit: any, idx: number, arr: any[]) => (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-3 bg-[#09090b]/50 border border-[#27272a]/60 rounded-lg group/hab"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 rounded-md bg-[#27272a]/40 text-emerald-400 shrink-0">
                          <HabitIconHelper name={habit.icon} className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-[#fafafa] truncate">{habit.name}</span>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Mover para cima */}
                        {idx > 0 && (
                          <button
                            onClick={() => handleReorderHabit(habit.id, 'up')}
                            className="p-1.5 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] outline-none"
                            title="Mover para Cima"
                            aria-label="Mover hábito para cima"
                          >
                            <LucideIcons.ArrowUp className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Mover para baixo */}
                        {idx < arr.length - 1 && (
                          <button
                            onClick={() => handleReorderHabit(habit.id, 'down')}
                            className="p-1.5 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] outline-none"
                            title="Mover para Baixo"
                            aria-label="Mover hábito para baixo"
                          >
                            <LucideIcons.ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Editar */}
                        <button
                          onClick={() => handleOpenEditHabit(habit)}
                          className="p-1.5 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-primary cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] outline-none"
                          title="Editar Hábito"
                          aria-label={`Editar hábito ${habit.name}`}
                        >
                          <LucideIcons.Edit className="h-3.5 w-3.5" />
                        </button>
                        {/* Arquivar */}
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="p-1.5 rounded hover:bg-[#27272a] text-[#a1a1aa] hover:text-rose-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#ef4444] outline-none"
                          title="Arquivar Hábito"
                          aria-label={`Arquivar hábito ${habit.name}`}
                        >
                          <LucideIcons.Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#27272a] bg-[#09090b]">
              <Button
                type="button"
                onClick={() => setIsHabitManagerOpen(false)}
                className="w-full h-9 font-bold border border-[#27272a] bg-transparent text-[#fafafa] hover:bg-[#27272a] rounded-md transition-smooth font-mono text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal - Criar/Editar Hábito */}
      {isCreateHabitOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[1px] animate-fade-in select-none"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsCreateHabitOpen(false);
            }
          }}
        >
          <div className="w-full max-w-[360px] bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-sm">
            <form onSubmit={handleSaveHabit}>
              <div className="p-4 border-b border-[#27272a]/60">
                <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">
                  {editingHabit ? 'Editar Hábito' : 'Novo Hábito'}
                </h3>
              </div>

              <div className="p-4 space-y-4">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label htmlFor="habit-name" className="text-[10px] font-bold text-[#a1a1aa] uppercase">
                    Nome do Hábito
                  </label>
                  <Input
                    id="habit-name"
                    placeholder="Ex: Beber 2L de Água"
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    maxLength={50}
                    required
                    autoFocus
                    className="focus-visible:ring-2 focus-visible:ring-[#6366f1] outline-none"
                  />
                </div>

                {/* Ícones */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#a1a1aa] uppercase block">
                    Selecione um Ícone
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {COMMON_HABIT_ICONS.map((opt) => {
                      const OptIcon = (LucideIcons as any)[opt.name];
                      const isSelected = habitIcon === opt.name;
                      return (
                        <button
                          type="button"
                          key={opt.name}
                          onClick={() => setHabitIcon(opt.name)}
                          title={opt.label}
                          aria-label={`Ícone ${opt.label}`}
                          className={cn(
                            "p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-smooth cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] outline-none",
                            isSelected 
                              ? "bg-[#6366f1]/25 border-[#6366f1] text-[#fafafa]" 
                              : "bg-[#09090b]/40 border-[#27272a] text-[#a1a1aa] hover:border-[#27272a] hover:text-[#fafafa]"
                          )}
                        >
                          <OptIcon className="h-5 w-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 border-t border-[#27272a] bg-[#09090b]">
                <Button
                  type="button"
                  onClick={() => setIsCreateHabitOpen(false)}
                  variant="outline"
                  className="flex-1 h-9 font-bold border border-[#27272a] bg-transparent text-[#fafafa] hover:bg-[#27272a] rounded-md transition-smooth font-mono text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-9 font-bold bg-[#6366f1] hover:bg-[#6366f1]/90 text-white rounded-md transition-smooth font-mono text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Detalhes do Dia (Energia, Qualidade, Nota) */}
      {isDayDetailModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in select-none"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsDayDetailModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-[400px] bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-sm">
            <div className="p-5 border-b border-[#27272a]/60">
              <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">
                Detalhes do Dia
              </h3>
              <p className="text-[10px] text-[#a1a1aa] mt-0.5 font-semibold">
                Data: {selectedDayDate}
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Nível de Energia */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase block">
                  Nível de Energia
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDayDetailEnergy(lvl)}
                      className={cn(
                        "py-2 px-3.5 rounded-lg border text-xs font-bold uppercase transition-smooth cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] outline-none",
                        dayDetailEnergy === lvl
                          ? lvl === 'low' ? "bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]"
                            : lvl === 'medium' ? "bg-amber-500/20 border-amber-400 text-amber-300"
                            : "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                          : "bg-[#09090b]/40 border-[#27272a] text-[#a1a1aa] hover:border-[#27272a]"
                      )}
                      aria-label={`Energia ${lvl === 'low' ? 'Baixa' : lvl === 'medium' ? 'Média' : 'Alta'}`}
                    >
                      {lvl === 'low' ? 'Baixa' : lvl === 'medium' ? 'Média' : 'Alta'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualidade do Dia */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase block">
                  Qualidade do Dia
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['weak', 'ok', 'strong'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setDayDetailQuality(q)}
                      className={cn(
                        "py-2 px-3.5 rounded-lg border text-xs font-bold uppercase transition-smooth cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] outline-none",
                        dayDetailQuality === q
                          ? q === 'weak' ? "bg-rose-500/20 border-rose-400 text-rose-300"
                            : q === 'ok' ? "bg-amber-500/20 border-amber-400 text-amber-300"
                            : "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                          : "bg-[#09090b]/40 border-[#27272a] text-[#a1a1aa] hover:border-[#27272a]"
                      )}
                      aria-label={`Qualidade ${q === 'weak' ? 'Ruim' : q === 'ok' ? 'Ok' : 'Ótima'}`}
                    >
                      {q === 'weak' ? 'Ruim' : q === 'ok' ? 'Ok' : 'Ótima'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 border-t border-[#27272a] bg-[#09090b]">
              <Button
                type="button"
                onClick={() => setIsDayDetailModalOpen(false)}
                variant="outline"
                className="flex-1 h-9 font-bold border border-[#27272a] bg-transparent text-[#fafafa] hover:bg-[#27272a] rounded-md transition-smooth font-mono text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveDayDetail}
                className="flex-1 h-9 font-bold bg-[#6366f1] hover:bg-[#6366f1]/90 text-white rounded-md transition-smooth font-mono text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
