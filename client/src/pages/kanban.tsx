import React, { useEffect, useMemo, useState, useRef } from 'react';
import { DndContext, closestCenter, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import QuickAddModal from '@/components/QuickAddModal';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Flag, User, Calendar, Tag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { eventService } from '../lib/eventService';
import { format } from 'date-fns';

type TaskEvent = any;

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export default function KanbanPage() {
  const [tasks, setTasks] = useState<TaskEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<any>({ category: 'Task' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const loadTasks = async () => {
    const raw = await eventService.loadEvents();
    setTasks(raw.filter((e: any) => e.category === 'Task' && !e.parentId));
  };

  const projects = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      if (t.project) set.add(String(t.project));
    }
    return Array.from(set).sort();
  }, [tasks]);

  useEffect(() => { loadTasks(); }, []);

  const normalizeStatus = (s?: string) => {
    if (!s) return 'todo';
    return String(s).replace(/\s+/g, '').replace('inprogress', 'in_progress');
  };

  const byColumn = useMemo(() => {
    const map: Record<string, TaskEvent[]> = { todo: [], in_progress: [], done: [] };
    let filtered = tasks.filter(t => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return String(t.title || '').toLowerCase().includes(q) || String(t.assignee || '').toLowerCase().includes(q) || (t.tags || []).join(' ').toLowerCase().includes(q);
    });
    if (selectedProject) {
      filtered = filtered.filter(t => String(t.project || '') === selectedProject);
    }
    for (const t of filtered) {
      const rawStatus = t.status || (t.isCompleted ? 'done' : 'todo');
      const col = normalizeStatus(rawStatus).toLowerCase();
      if (map[col]) map[col].push(t);
      else map.todo.push(t);
    }
    return map;
  }, [tasks, searchQuery, selectedProject]);

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || !active) return;
    const fromId = String(active.id);
    const toColumn = String(over.id);
    const ev = tasks.find((t: any) => String(t.id) === fromId);
    if (!ev) return;
    const updates: any = { status: toColumn, isCompleted: toColumn === 'done' };

    // optimistic UI update
    setTasks(prev => prev.map(t => String(t.id) === fromId ? { ...t, ...updates } : t));

    // update storage
    await eventService.updateEvent(ev.id, updates);

    // reload to ensure canonical state after a short delay
    setTimeout(() => loadTasks(), 100);
  };

  const openNewTask = (columnId?: string) => {
    setModalInitialData({ category: 'Task', status: columnId || 'todo', project: selectedProject || undefined });
    setIsModalOpen(true);
  };
  const closeNewTask = () => { setIsModalOpen(false); setModalInitialData({ category: 'Task' }); };

  const handleCreateTask = async (formData: any) => {
    // Transform EventForm data into EventService shape
    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = formData.endDate && formData.endTime ? new Date(`${formData.endDate}T${formData.endTime}`) : undefined;
    const payload: any = {
      title: formData.title,
      description: formData.description,
      startTime: start,
      endTime: end,
      category: 'Task',
      color: formData.color || (formData.category === 'Task' ? '#ef4444' : '#3b82f6'),
      isCompleted: formData.status === 'done',
      status: formData.status || 'todo',
      project: formData.project || selectedProject || undefined,
    };

    // optimistic UI: insert a temporary item
    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...payload, id: tempId };
    setTasks(prev => [optimistic, ...prev]);

    try {
      await eventService.createEvent(payload);
      // refresh tasks from storage to get canonical data
      await loadTasks();
    } catch (err) {
      // rollback optimistic add
      setTasks(prev => prev.filter(t => t.id !== tempId));
      console.error('Failed to create task from Kanban:', err);
    }
  };

  // Edit existing task
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const openEdit = (task: any) => {
    setEditingTask(task);
    setEditModalOpen(true);
  };

  const closeEdit = () => {
    setEditingTask(null);
    setEditModalOpen(false);
  };

  const handleUpdateTask = async (formData: any) => {
    if (!editingTask) return;
    const updates: any = {
      title: formData.title,
      description: formData.description,
      startTime: new Date(`${formData.startDate}T${formData.startTime}`),
      endTime: formData.endDate && formData.endTime ? new Date(`${formData.endDate}T${formData.endTime}`) : undefined,
      color: formData.color || (formData.category === 'Task' ? '#ef4444' : '#3b82f6'),
      status: formData.status,
      isCompleted: formData.status === 'done',
      project: formData.project || editingTask.project || undefined,
    };
    await eventService.updateEvent(editingTask.id, updates);
    await loadTasks();
    closeEdit();
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="mt-4 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">Search</label>
            <input aria-label="Search tasks" className="w-full p-2 rounded border bg-white/80 dark:bg-gray-800/80" placeholder="Search by title, assignee or tag" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="w-48">
            <label className="block text-xs text-muted-foreground mb-1">Project Filter</label>
            <select aria-label="Filter by project" className="block w-full p-2 rounded border bg-white/80 dark:bg-gray-800/80 text-sm" value={selectedProject || ''} onChange={(e) => setSelectedProject(e.target.value || null)}>
              <option value="">All projects</option>
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Button onClick={() => openNewTask()} variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      <Timeline tasks={tasks} selectedProject={selectedProject} />

      <div>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-3 gap-4">
            {columns.map(col => (
              <DroppableColumn key={col.id} id={col.id} bgClass={col.id === 'todo' ? 'bg-yellow-50 dark:bg-yellow-900/20' : col.id === 'in_progress' ? 'bg-sky-50 dark:bg-sky-900/20' : 'bg-green-50 dark:bg-green-900/20'}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">{col.title}</div>
                  <Badge variant="secondary" className="text-xs">{byColumn[col.id].length}</Badge>
                </div>
                <div className="space-y-2">
                  {byColumn[col.id].map((task: any) => (
                    <div key={task.id} onClick={() => openEdit(task)}>
                      <KanbanCard task={task} onDelete={async (t: any) => { const updated = await handleDeleteTask(t); if (updated) setTasks(updated); }} onEdit={() => openEdit(task)} />
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <Button size="sm" variant="ghost" onClick={() => openNewTask(col.id)} className="w-full text-xs">
                    <Plus className="mr-2 h-4 w-4" /> Add to {col.title}
                  </Button>
                </div>
              </DroppableColumn>
            ))}
          </div>
        </DndContext>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="text-xs text-muted-foreground mb-1 text-center">Overall Progress</div>
          <div className="flex items-center gap-3 justify-center">
            <div className="text-sm font-medium">{tasks.filter(t => t.isCompleted).length}/{tasks.length} done</div>
            <div className="w-96">
              <Progress value={tasks.length > 0 ? (tasks.filter(t => t.isCompleted).length / tasks.length) * 100 : 0} className="h-2 rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="rounded-lg p-3 shadow-sm bg-white dark:bg-gray-800 border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium">Activity</h3>
              <div className="text-xs text-muted-foreground">Recent tasks</div>
            </div>
            <div className="text-xs text-muted-foreground">{tasks.length}</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {tasks.slice().sort((a:any,b:any)=> new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0,12).map((t:any)=> (
              <div key={t.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div style={{ width: 6, height: 40, backgroundColor: t.color || '#ef4444', borderRadius: 6 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{t.assignee ? t.assignee + ' • ' : ''}{t.status || (t.isCompleted ? 'done' : 'todo')}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{t.project || ''} • {t.startTime ? format(new Date(t.startTime), 'MMM d, HH:mm') : ''}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <h3 className="text-sm font-medium text-blue-800 mb-1">💡 Productivity Tip</h3>
        <p className="text-sm text-blue-700">Break down large tasks into smaller, actionable steps to make progress feel achievable and maintain momentum.</p>
      </div>

      <QuickAddModal isOpen={editModalOpen} onClose={closeEdit} onSubmit={handleUpdateTask} initialData={editingTask || undefined} />
    </div>
  );
}

function Timeline({ tasks, selectedProject }: { tasks: any[]; selectedProject?: string | null }) {
  // Simple timeline that shows tasks over a 14-day window centered on today
  const days = 14;
  const start = new Date();
  start.setDate(start.getDate() - Math.floor(days / 2));
  const end = new Date(start);
  end.setDate(start.getDate() + days);

  const visibleTasks = tasks.filter(t => {
    if (selectedProject && String(t.project || '') !== selectedProject) return false;
    return !!t.startTime;
  });

  const totalMs = end.getTime() - start.getTime();

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Timeline
        </div>
        <div className="text-xs text-muted-foreground">Showing {visibleTasks.length} tasks</div>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="relative p-3 rounded-lg bg-gradient-to-r from-indigo-50/10 to-sky-50/10 dark:from-indigo-900/10 dark:to-sky-900/10" style={{ minWidth: `${days * 110}px`, height: 120, borderRadius: 10, border: '1px solid rgba(15,23,42,0.03)' }}>
          {/* timeline track */}
          <div className="absolute left-0 right-0 top-6 bottom-10 bg-transparent" />
          {visibleTasks.map(t => {
            if (!t.startTime) return null;
            const s = new Date(t.startTime).getTime();
            const e = t.endTime ? new Date(t.endTime).getTime() : (s + 3600 * 1000);
            const clampedStart = Math.max(s, start.getTime());
            const clampedEnd = Math.min(e, end.getTime());
            if (clampedEnd <= clampedStart) return null;
            const left = ((clampedStart - start.getTime()) / totalMs) * 100;
            const width = Math.max(((clampedEnd - clampedStart) / totalMs) * 100, 0.6);
            const isNarrow = width < 4;
            const narrow = width < 4;
            return (
              <div key={t.id} style={{ position: 'absolute', left: `${left}%`, top: narrow ? 6 : 18, width: `${width}%` }}>
                {narrow && (
                  <div className="text-[11px] font-medium mb-1 text-slate-700 truncate" style={{ maxWidth: '100px' }}>{t.title}</div>
                )}
                <div title={`${t.title} — ${t.assignee || ''}`} style={{ backgroundColor: t.color || '#ef4444', height: narrow ? 12 : 36, borderRadius: 8, padding: narrow ? '2px 6px' : '8px 10px', color: narrow ? '#071233' : '#071233', boxShadow: '0 2px 6px rgba(2,6,23,0.06)' }}>
                  {!narrow && (
                    <div>
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-[12px] text-muted-foreground">{t.assignee || ''}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div className="absolute bottom-0 left-0 right-0 flex items-center text-xs text-muted-foreground px-2" style={{ height: 40 }}>
            {Array.from({ length: days }).map((_, i) => {
              const d = new Date(start);
              d.setDate(start.getDate() + i);
              return (
                <div key={i} className="w-[110px] text-center border-l border-gray-300 first:border-l-0" style={{ paddingLeft: 6, paddingRight: 6 }}>
                  <div className="text-[12px] font-medium">{format(d, 'MMM d')}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ id, title, children, bgClass }: { id: string; title?: string; children: React.ReactNode; bgClass?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef as any} className={`${bgClass || 'bg-muted/10'} rounded p-3 min-h-[320px] ${isOver ? 'ring-2 ring-primary/40' : ''}`}>
      {title && <div className="font-medium mb-2">{title}</div>}
      <div id={id}>
        {children}
      </div>
    </div>
  );
}

async function handleDeleteTask(task: any) {
  if (!task) return;
  if (task.parentId) {
    // create exception to skip this occurrence
    const { id, ...rest } = task as any;
    await eventService.createException({ ...rest, parentId: task.parentId, isSkipped: true });
  } else {
    await eventService.deleteEvent(task.id);
  }
  // reload tasks
  const raw = await eventService.loadEvents();
  // update state by directly setting local variable - safe since caller will reload
  // (callers of handleDeleteTask do not await this return value for UI updates)
  return raw.filter((e: any) => e.category === 'Task' && !e.parentId);
}

function KanbanCard({ task, onDelete, onEdit }: { task: any; onDelete?: (task: any) => void; onEdit?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(task.id) });
  return (
    <div ref={setNodeRef as any} {...listeners} {...attributes} style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }} className="mb-2 cursor-grab">
      <div className={`p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border flex items-start gap-3 hover:shadow-md transition-shadow ${isDragging ? 'opacity-70' : ''}`}>
        <div style={{ width: 6, height: 40, backgroundColor: task.color || '#ef4444', borderRadius: 4 }} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium truncate">{task.title}</div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}>
              <Edit className="h-3 w-3" />
            </Button>
          </div>
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
            {task.assignee && <div className="inline-flex items-center gap-1"><User className="h-3 w-3" /> <span className="truncate">{task.assignee}</span></div>}
            {task.priority && <div className="inline-flex items-center gap-1"><Flag className="h-3 w-3" /> <span>{task.priority}</span></div>}
            {task.endTime && <div className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> <span>{format(new Date(task.endTime), 'MMM d')}</span></div>}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {(task.tags || []).slice(0,3).map((tg: string) => <Badge key={tg} className="text-xs">{tg}</Badge>)}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onDelete && onDelete(task); }}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
