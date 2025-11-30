import React, { useMemo, useState, useRef, useCallback } from 'react';
import { format, addDays, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Event } from "@/lib/eventService";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  GripVertical
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface GanttChartProps {
  tasks: Event[];
  onTaskClick?: (task: Event) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Event>) => void;
}

interface GanttTask extends Event {
  dependencies: string[];
  level: number;
  criticalPath: boolean;
  resourceLoad: number;
  milestones: { date: Date; title: string }[];
}

interface SortableTaskItemProps {
  task: GanttTask;
  onTaskClick?: (task: Event) => void;
}

function SortableTaskItem({ task, onTaskClick }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex border-b hover:bg-muted/30 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="w-80 p-4 border-r flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-medium truncate cursor-pointer hover:text-primary"
            onClick={() => onTaskClick?.(task)}
          >
            {task.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {task.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {task.assignee.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <Badge variant="outline" className="text-xs">
              {task.status?.replace('_', ' ') || 'To Do'}
            </Badge>
            {task.criticalPath && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Critical
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GanttChart({ tasks, onTaskClick, onTaskUpdate }: GanttChartProps) {
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month'>('week');
  const [startDate, setStartDate] = useState(() => {
    const earliestTask = tasks.reduce((earliest, task) =>
      task.startTime < earliest ? task.startTime : earliest,
      new Date()
    );
    return startOfWeek(earliestTask);
  });
  const [draggedTask, setDraggedTask] = useState<GanttTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Calculate date range based on zoom level
  const dateRange = useMemo(() => {
    const days = zoomLevel === 'day' ? 30 : zoomLevel === 'week' ? 90 : 180;
    return eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, days)
    });
  }, [startDate, zoomLevel]);

  // Process tasks for Gantt chart
  const ganttTasks = useMemo(() => {
    const taskMap = new Map<string, GanttTask>();

    // Convert tasks to GanttTask format
    tasks.forEach(task => {
      if (task.category === 'Task') {
        taskMap.set(task.id, {
          ...task,
          dependencies: task.dependencies || [],
          level: 0,
          criticalPath: false,
          resourceLoad: Math.random() * 100, // Mock resource load
          milestones: [
            { date: task.startTime, title: 'Start' },
            ...(task.endTime ? [{ date: task.endTime, title: 'End' }] : [])
          ]
        });
      }
    });

    // Precompute dependency graph and levels using a queue (more efficient than repeated scans)
    const depGraph = new Map<string, string[]>();
    taskMap.forEach(t => depGraph.set(t.id, t.dependencies.slice()));
    // Initialize levels
    const queue: string[] = [];
    taskMap.forEach((t, id) => {
      if (!t.dependencies || t.dependencies.length === 0) {
        queue.push(id);
        t.level = 0;
      }
    });
    while (queue.length) {
      const id = queue.shift()!;
      const node = taskMap.get(id)!;
      // propagate to dependents
      taskMap.forEach(t => {
        if (t.dependencies && t.dependencies.includes(id)) {
          const newLevel = node.level + 1;
          if (newLevel > t.level) {
            t.level = newLevel;
            queue.push(t.id);
          }
        }
      });
    }

    // Calculate critical path (simplified) and deterministic resource load
    const now = new Date();
    taskMap.forEach(task => {
      const isOverdue = task.endTime && task.endTime < now && task.status !== 'done';
      const isHighPriority = task.priority === 'urgent' || task.priority === 'high';
      task.criticalPath = Boolean(isOverdue || (isHighPriority && (task.dependencies?.length || 0) > 0));
      // Deterministic resource load: based on estimatedHours or fallback to duration
      if (typeof task.estimatedHours === 'number') {
        task.resourceLoad = Math.min(100, Math.max(0, (task.estimatedHours / 40) * 100));
      } else if (task.endTime) {
        const hours = Math.max(1, Math.abs((task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60 * 60)));
        task.resourceLoad = Math.min(100, (hours / 40) * 100);
      } else {
        task.resourceLoad = 10;
      }
    });

    return Array.from(taskMap.values()).sort((a, b) => a.level - b.level);
  }, [tasks]);

  // Calculate task position and width
  const getTaskPosition = useCallback((task: GanttTask) => {
    const start = task.startTime;
    const end = task.endTime || addDays(task.startTime, 1);
    const totalDays = Math.max(1, differenceInDays(dateRange[dateRange.length - 1], dateRange[0]));
    const taskDays = Math.max(1, differenceInDays(end, start));

    const left = (differenceInDays(start, dateRange[0]) / totalDays) * 100;
    const width = (taskDays / totalDays) * 100;

    return { left: Math.max(0, left), width: Math.max(1, width) };
  }, [dateRange]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const days = zoomLevel === 'day' ? 7 : zoomLevel === 'week' ? 14 : 30;
    setStartDate(prev => addDays(prev, direction === 'next' ? days : -days));
  };

  const getTaskColor = (task: GanttTask) => {
    if (task.criticalPath) return 'bg-red-500';
    if (task.status === 'done') return 'bg-green-500';
    if (task.status === 'in_progress') return 'bg-blue-500';
    if (task.status === 'blocked') return 'bg-orange-500';
    return 'bg-gray-400';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = ganttTasks.find(t => t.id === active.id);
    setDraggedTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over || active.id === over.id) return;

    // Handle task reordering or date changes
    const draggedTask = ganttTasks.find(t => t.id === active.id);
    if (draggedTask) {
      // For now, just log the drag operation
      console.log('Task dragged:', draggedTask.title, 'to position:', over.id);
    }
  };

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gantt Chart
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="flex border rounded">
                <Button
                  variant={zoomLevel === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setZoomLevel('day')}
                  className="rounded-r-none"
                >
                  Day
                </Button>
                <Button
                  variant={zoomLevel === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setZoomLevel('week')}
                  className="rounded-none"
                >
                  Week
                </Button>
                <Button
                  variant={zoomLevel === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setZoomLevel('month')}
                  className="rounded-l-none"
                >
                  Month
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto">
              {/* Timeline Header */}
              <div className="flex border-b bg-muted/50">
                <div className="w-80 p-4 font-medium border-r">Task</div>
                <div className="flex-1 flex">
                  {zoomLevel === 'month' ?
                    // Monthly view
                    dateRange.filter((_, i) => i % 30 === 0).map(date => (
                      <div key={date.toISOString()} className="flex-1 p-2 text-center border-r text-sm font-medium">
                        {format(date, 'MMM yyyy')}
                      </div>
                    )) :
                    zoomLevel === 'week' ?
                    // Weekly view
                    dateRange.filter((_, i) => i % 7 === 0).map(date => (
                      <div key={date.toISOString()} className="flex-1 p-2 text-center border-r text-sm font-medium">
                        {format(date, 'MMM d')}
                      </div>
                    )) :
                    // Daily view
                    dateRange.filter((_, i) => i % 7 === 0).map(date => (
                      <div key={date.toISOString()} className="flex-1 p-2 text-center border-r text-sm font-medium">
                        {format(date, 'MMM d')}
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Tasks */}
              <SortableContext items={ganttTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {ganttTasks.map((task, index) => {
                  const position = getTaskPosition(task);
                  const progress = task.status === 'done' ? 100 :
                                 task.status === 'in_progress' ? 50 : 0;

                  return (
                    <div key={task.id} className="flex border-b hover:bg-muted/30">
                      {/* Task Info */}
                      <div className="w-80 p-4 border-r">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getTaskColor(task)}`} />
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-medium truncate cursor-pointer hover:text-primary"
                              onClick={() => onTaskClick?.(task)}
                            >
                              {task.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {task.assignee && (
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {task.assignee.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {task.status?.replace('_', ' ') || 'To Do'}
                              </Badge>
                              {task.criticalPath && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Critical
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="text-xs text-muted-foreground">
                                Resource Load: {Math.round(task.resourceLoad)}%
                              </div>
                              <Progress value={task.resourceLoad} className="h-1 w-16" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex-1 relative h-20 border-r">
                        {/* Task Bar */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`absolute top-6 h-8 rounded cursor-pointer hover:opacity-80 transition-opacity ${getTaskColor(task)} ${getPriorityColor(task.priority)} border-l-4`}
                              style={{
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                                minWidth: '20px'
                              }}
                              onClick={() => onTaskClick?.(task)}
                            >
                              <div className="px-2 py-1 text-white text-xs font-medium truncate">
                                {task.title}
                              </div>
                              {progress > 0 && (
                                <div
                                  className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-bl"
                                  style={{ width: `${progress}%` }}
                                />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">{task.title}</div>
                              <div>Start: {format(task.startTime, 'MMM d, yyyy')}</div>
                              {task.endTime && <div>End: {format(task.endTime, 'MMM d, yyyy')}</div>}
                              <div>Status: {task.status?.replace('_', ' ') || 'To Do'}</div>
                              {task.assignee && <div>Assignee: {task.assignee}</div>}
                              <div>Resource Load: {Math.round(task.resourceLoad)}%</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>

                        {/* Milestones */}
                        {task.milestones.map((milestone, idx) => {
                          const milestonePos = differenceInDays(milestone.date, dateRange[0]) / differenceInDays(dateRange[dateRange.length - 1], dateRange[0]) * 100;
                          return (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <div
                                  className="absolute top-2 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-sm"
                                  style={{ left: `${milestonePos}%` }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <div className="font-medium">{milestone.title}</div>
                                  <div>{format(milestone.date, 'MMM d, yyyy')}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}

                        {/* Dependency Lines */}
                        {task.dependencies.map(depId => {
                          const depTask = ganttTasks.find(t => t.id === depId);
                          if (!depTask) return null;

                          const depPosition = getTaskPosition(depTask);
                          const currentPosition = position;

                          return (
                            <svg
                              key={depId}
                              className="absolute inset-0 pointer-events-none"
                              style={{ zIndex: 1 }}
                            >
                              <defs>
                                <marker
                                  id={`arrowhead-${depId}`}
                                  markerWidth="10"
                                  markerHeight="7"
                                  refX="9"
                                  refY="3.5"
                                  orient="auto"
                                >
                                  <polygon
                                    points="0 0, 10 3.5, 0 7"
                                    fill="currentColor"
                                    className="text-muted-foreground"
                                  />
                                </marker>
                              </defs>
                              <path
                                d={`M ${depPosition.left + depPosition.width}% ${index * 80 + 40} L ${currentPosition.left}% ${index * 80 + 40}`}
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeDasharray="2,2"
                                className="text-muted-foreground"
                                markerEnd={`url(#arrowhead-${depId})`}
                              />
                            </svg>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </SortableContext>

              {ganttTasks.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No tasks to display</p>
                  <p className="text-sm">Create some tasks to see the Gantt chart</p>
                </div>
              )}
            </div>

            <DragOverlay>
              {draggedTask ? (
                <div className="bg-white border rounded shadow-lg p-2">
                  <div className="font-medium text-sm">{draggedTask.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(draggedTask.startTime, 'MMM d')} - {draggedTask.endTime ? format(draggedTask.endTime, 'MMM d') : 'No end date'}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}