import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertTriangle, User, Flag, Play, Square, Check, X } from "lucide-react";
import { Event } from "@/lib/eventService";
import { useMemo, useState } from 'react';

const getPriorityIcon = (priority?: string) => {
  switch (priority) {
    case 'urgent': return <Flag className="h-3 w-3 text-red-500" />;
    case 'high': return <Flag className="h-3 w-3 text-orange-500" />;
    case 'medium': return <Flag className="h-3 w-3 text-yellow-500" />;
    case 'low': return <Flag className="h-3 w-3 text-green-500" />;
    default: return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'done': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
    case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
    case 'blocked': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
    default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'done': return <Check className="h-3 w-3" />;
    case 'in_progress': return <Play className="h-3 w-3" />;
    case 'blocked': return <X className="h-3 w-3" />;
    default: return <Square className="h-3 w-3" />;
  }
};

function TaskItem({ task, onTaskClick, onStatusChange }: { task: Event; onTaskClick: (task: Event) => void; onStatusChange?: (eventId: string, newStatus: string) => void }) {
  return (
    <Card
      className="hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 group"
      style={{ borderLeftColor: task.color || '#3b82f6' }}
      onClick={() => onTaskClick(task)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium truncate flex-1 mr-2 group-hover:text-primary transition-colors">
            {task.title}
          </h4>
          {getPriorityIcon(task.priority)}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          {task.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{task.assignee}</span>
            </div>
          )}
          {task.estimatedHours && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>

        {task.status && task.status !== 'todo' && (
          <Badge className={`text-xs mb-2 ${getStatusColor(task.status)}`}>
            {getStatusIcon(task.status)}
            <span className="ml-1">{task.status.replace('_', ' ')}</span>
          </Badge>
        )}

        {onStatusChange && (
          <div className="flex gap-1 mt-2">
            {task.status !== 'todo' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, 'todo');
                }}
              >
                To Do
              </Button>
            )}
            {task.status !== 'in_progress' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, 'in_progress');
                }}
              >
                Start
              </Button>
            )}
            {task.status !== 'done' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs hover:bg-green-50 hover:text-green-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, 'done');
                }}
              >
                Done
              </Button>
            )}
          </div>
        )}

        {task.endTime && new Date(task.endTime) < new Date() && !task.isCompleted && (
          <div className="flex items-center gap-1 mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            <AlertTriangle className="h-3 w-3" />
            <span>Overdue</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TaskManagementSidebarProps {
  events: Event[];
  onTaskClick: (task: Event) => void;
  onStatusChange?: (eventId: string, newStatus: string) => void;
}

export default function TaskManagementSidebar({ events, onTaskClick, onStatusChange }: TaskManagementSidebarProps) {
  // Filter tasks - show only events with category "Task"
  const tasks = useMemo(() => events.filter(event => event.category === 'Task'), [events]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => ({
    todo: tasks.filter(task => task.status === 'todo' || !task.status),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    done: tasks.filter(task => task.status === 'done'),
    blocked: tasks.filter(task => task.status === 'blocked'),
  }), [tasks]);

  // Use top-level helpers and TaskItem implementation above

  return (
    <div className="p-4 space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-4 text-white shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="font-semibold">Task Management</h3>
          </div>
          <p className="text-sm opacity-90">"Track progress, achieve goals!"</p>
        </div>
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Progress Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">
            {tasksByStatus.done.length}/{tasks.length} tasks
          </span>
        </div>
        <Progress
          value={tasks.length > 0 ? (tasksByStatus.done.length / tasks.length) * 100 : 0}
          className="h-2"
        />
      </Card>

      {/* To Do */}
      {tasksByStatus.todo.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gray-400 shadow-sm"></div>
            <span className="text-sm font-semibold text-foreground">To Do</span>
            <Badge variant="secondary" className="text-xs">
              {tasksByStatus.todo.length}
            </Badge>
          </div>
          <TasksSectionList tasks={tasksByStatus.todo} onTaskClick={onTaskClick} onStatusChange={onStatusChange} limit={3} />
        </div>
      )}

      {/* In Progress */}
      {tasksByStatus.in_progress.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
            <span className="text-sm font-semibold text-foreground">In Progress</span>
            <Badge variant="secondary" className="text-xs">
              {tasksByStatus.in_progress.length}
            </Badge>
          </div>
          <TasksSectionList tasks={tasksByStatus.in_progress} onTaskClick={onTaskClick} onStatusChange={onStatusChange} limit={3} />
        </div>
      )}

      {/* Blocked */}
      {tasksByStatus.blocked.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
            <span className="text-sm font-semibold text-foreground">Blocked</span>
            <Badge variant="secondary" className="text-xs">
              {tasksByStatus.blocked.length}
            </Badge>
          </div>
          <div className="space-y-2 pl-6">
            {tasksByStatus.blocked.slice(0, 3).map(task => (
              <TaskItem key={task.id} task={task} onTaskClick={onTaskClick} onStatusChange={onStatusChange} />
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {tasksByStatus.done.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
            <span className="text-sm font-semibold text-foreground">Done</span>
            <Badge variant="secondary" className="text-xs">
              {tasksByStatus.done.length}
            </Badge>
          </div>
          <TasksSectionList tasks={tasksByStatus.done} onTaskClick={onTaskClick} onStatusChange={onStatusChange} limit={2} />
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No tasks yet</p>
          <p className="text-xs">Create your first task to get started</p>
        </div>
      )}
    </div>
  );
}

function TasksSectionList({ tasks, onTaskClick, onStatusChange, limit }: { tasks: Event[]; onTaskClick: (task: Event) => void; onStatusChange?: (eventId: string, newStatus: string) => void; limit: number }) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? tasks : tasks.slice(0, limit);

  return (
    <div className="space-y-2 pl-6">
      {visible.map(task => (
        <div key={task.id}>
          <TaskItem task={task} onTaskClick={onTaskClick} onStatusChange={onStatusChange} />
        </div>
      ))}
      {tasks.length > limit && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs hover:bg-muted/50 transition-colors"
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? 'Show Less' : `View ${tasks.length - limit} more...`}
        </Button>
      )}
    </div>
  );
}