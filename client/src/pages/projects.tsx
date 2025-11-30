import { useState, useEffect, useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Flag,
  TrendingUp,
  BarChart3,
  Plus,
  Filter,
  Search,
  Sparkles,
  Target,
  Zap,
  Trophy,
  X,
  SlidersHorizontal
} from "lucide-react";
import { eventService, Event } from "@/lib/eventService";
import ThemeToggle from "@/components/ThemeToggle";
import React, { Suspense } from 'react';
const GanttChart = React.lazy(() => import('@/components/GanttChart'));

export default function ProjectsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [recurringParents, setRecurringParents] = useState<Event[]>([]);

  // State for search, filters, and new project modal
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    project: 'all'
  });
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    color: '#3b82f6'
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Load events from storage on mount
  useEffect(() => {
    const loadEvents = async () => {
      const loadedEvents = await eventService.loadEvents();
      setEvents(loadedEvents);
      const parents = await eventService.getRecurringParents();
      setRecurringParents(parents);
    };
    loadEvents();
  }, []);

  // Filter tasks (only events with category 'Task')
  const tasks = useMemo(() => events.filter(event => event.category === 'Task'), [events]);

  // Apply search and filters to tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = filters.status === 'all' ||
        (filters.status === 'completed' && task.isCompleted) ||
        (filters.status === 'pending' && !task.isCompleted);

      // Priority filter
      const matchesPriority = filters.priority === 'all' ||
        task.priority === filters.priority;

      // Assignee filter
      const matchesAssignee = filters.assignee === 'all' ||
        task.assignee === filters.assignee;

      // Project filter
      const matchesProject = filters.project === 'all' ||
        task.project === filters.project;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesProject;
    });
  }, [tasks, searchQuery, filters]);

  // Handler functions for buttons
  const handleNewProject = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleCreateProject = async () => {
    if (!newProjectData.name.trim()) return;

    const newProject: Event = {
      id: Date.now().toString(),
      title: newProjectData.name,
      description: newProjectData.description,
      startTime: new Date(newProjectData.startDate || Date.now()),
      endTime: new Date(newProjectData.endDate || Date.now()),
      category: 'Project',
      color: newProjectData.color,
      isCompleted: false,
      priority: 'medium',
      project: newProjectData.name
    };

    const updatedEvents = [...events, newProject];
    await eventService.saveEvents(updatedEvents);
    setEvents(updatedEvents);
    setIsNewProjectModalOpen(false);
    setNewProjectData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      color: '#3b82f6'
    });
  };

  // Get all projects
  const projects = useMemo(() => {
    const projectMap = new Map<string, {
      name: string;
      tasks: Event[];
      completedTasks: number;
      totalTasks: number;
      overdueTasks: number;
      progress: number;
      assignees: Set<string>;
      priorities: { urgent: number; high: number; medium: number; low: number };
    }>();

    tasks.forEach(task => {
      if (!task.project) return;

      if (!projectMap.has(task.project)) {
        projectMap.set(task.project, {
          name: task.project,
          tasks: [],
          completedTasks: 0,
          totalTasks: 0,
          overdueTasks: 0,
          progress: 0,
          assignees: new Set(),
          priorities: { urgent: 0, high: 0, medium: 0, low: 0 }
        });
      }

      const project = projectMap.get(task.project)!;
      project.tasks.push(task);
      project.totalTasks++;

      if (task.status === 'done') {
        project.completedTasks++;
      }

      if (task.assignee) {
        project.assignees.add(task.assignee);
      }

      if (task.priority) {
        project.priorities[task.priority as keyof typeof project.priorities]++;
      }

      if (task.endTime && new Date(task.endTime) < new Date() && task.status !== 'done') {
        project.overdueTasks++;
      }

      project.progress = project.totalTasks > 0 ? (project.completedTasks / project.totalTasks) * 100 : 0;
    });

    return Array.from(projectMap.values()).sort((a, b) => b.progress - a.progress);
  }, [tasks]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => ({
    todo: filteredTasks.filter(task => task.status === 'todo' || !task.status),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    done: filteredTasks.filter(task => task.status === 'done'),
    blocked: filteredTasks.filter(task => task.status === 'blocked'),
  }), [filteredTasks]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedTasks = tasksByStatus.done.length;
    const overdueTasks = filteredTasks.filter(task =>
      task.endTime && new Date(task.endTime) < new Date() && task.status !== 'done'
    ).length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return { totalTasks, completedTasks, overdueTasks, progress };
  }, [filteredTasks, tasksByStatus.done]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      case 'blocked': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  const ProjectCard = ({ project }: { project: typeof projects[0] }) => (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:scale-[1.02] hover:border-primary/20 cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl group-hover:from-primary/20 transition-colors duration-500"></div>

      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border/50 group-hover:border-primary/30 transition-colors">
            {project.completedTasks}/{project.totalTasks} tasks
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{Math.round(project.progress)}%</span>
          </div>
          <Progress
            value={project.progress}
            className="h-3 bg-muted/50"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 group-hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
            <div className={`text-lg font-bold ${project.overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {project.overdueTasks}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 group-hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Team</span>
            </div>
            <div className="text-lg font-bold text-primary">
              {project.assignees.size}
            </div>
          </div>
        </div>

        {project.assignees.size > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Team Members</span>
            <div className="flex flex-wrap gap-2">
              {Array.from(project.assignees).slice(0, 4).map(assignee => (
                <Avatar key={assignee} className="h-8 w-8 ring-2 ring-background group-hover:ring-primary/20 transition-colors">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                    {assignee.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.assignees.size > 4 && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground border-2 border-background">
                  +{project.assignees.size - 4}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Priority Breakdown</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(project.priorities).map(([priority, count]) =>
              count > 0 ? (
                <Badge
                  key={priority}
                  className={`text-xs px-2 py-1 ${getPriorityColor(priority)} border-border/50 hover:scale-105 transition-transform`}
                >
                  <Flag className="h-3 w-3 mr-1" />
                  {priority}: {count}
                </Badge>
              ) : null
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TaskCard = ({ task }: { task: Event }) => (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:scale-[1.02] hover:border-primary/20 cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(task.status || 'todo').includes('green') ? 'bg-green-500' : getStatusColor(task.status || 'todo').includes('blue') ? 'bg-blue-500' : getStatusColor(task.status || 'todo').includes('red') ? 'bg-red-500' : 'bg-gray-500'} opacity-60 group-hover:opacity-100 transition-opacity`}></div>

      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2 mb-1">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          {task.priority && (
            <Badge className={`ml-3 text-xs px-2 py-1 ${getPriorityColor(task.priority)} border-border/50 hover:scale-105 transition-transform shrink-0`}>
              <Flag className="h-3 w-3 mr-1" />
              {task.priority}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          {task.project && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="font-medium">{task.project}</span>
            </div>
          )}
          {task.assignee && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
              <User className="h-3.5 w-3.5" />
              <span className="font-medium">{task.assignee}</span>
            </div>
          )}
          {task.estimatedHours && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{task.estimatedHours}h</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge className={`text-xs px-3 py-1.5 font-medium ${getStatusColor(task.status || 'todo')} border-border/50`}>
            {task.status?.replace('_', ' ') || 'To Do'}
          </Badge>

          <div className="flex items-center gap-2">
            {task.endTime && new Date(task.endTime) < new Date() && task.status !== 'done' && (
              <Badge variant="destructive" className="text-xs px-2 py-1 animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}

            {task.estimatedHours && task.actualHours && (
              <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {task.actualHours}/{task.estimatedHours}h
              </div>
            )}
          </div>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border/50">
            {task.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                #{tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border-b backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl shadow-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Project Dashboard
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Manage your projects with style and precision
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:scale-105 transition-transform"
                onClick={handleNewProject}
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 hover:scale-105 transition-transform"
                  >
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Filter Tasks</h4>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="assignee">Assignee</Label>
                        <Select value={filters.assignee} onValueChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {/* Add unique assignees from tasks */}
                            {Array.from(new Set(tasks.map(task => task.assignee).filter(Boolean))).map(assignee => (
                              <SelectItem key={assignee} value={assignee!}>{assignee}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="project">Project</Label>
                        <Select value={filters.project} onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {/* Add unique projects from tasks */}
                            {Array.from(new Set(tasks.map(task => task.project).filter(Boolean))).map(project => (
                              <SelectItem key={project} value={project!}>{project}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ status: 'all', priority: 'all', assignee: 'all', project: 'all' })}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              {isSearchOpen && (
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 transition-all duration-300 animate-in slide-in-from-right-2"
                  autoFocus
                />
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:scale-105 transition-transform"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                      {overallStats.completedTasks}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    Completed Tasks
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Great progress! 🎉
                  </div>
                </div>
                <Trophy className="h-8 w-8 text-green-500/30 group-hover:text-green-500/50 transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                      <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                      {overallStats.totalTasks}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Total Tasks
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    All objectives 📋
                  </div>
                </div>
                <Target className="h-8 w-8 text-blue-500/30 group-hover:text-blue-500/50 transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                      <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                      {Math.round(overallStats.progress)}%
                    </div>
                  </div>
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Overall Progress
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    On track! 📈
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500/30 group-hover:text-purple-500/50 transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/20 border-red-200/50 dark:border-red-800/50 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                      {overallStats.overdueTasks}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">
                    Overdue Tasks
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Needs attention ⚠️
                  </div>
                </div>
                <Zap className="h-8 w-8 text-red-500/30 group-hover:text-red-500/50 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Content */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-lg">
          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger
                value="projects"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Projects Overview
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                All Tasks
              </TabsTrigger>
              <TabsTrigger
                value="gantt"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Gantt Chart
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Projects Overview
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Track progress across all your projects
                  </p>
                </div>
                <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border/50 px-3 py-1">
                  {projects.length} projects
                </Badge>
              </div>

              {projects.length === 0 ? (
                <Card className="border-dashed border-2 border-border/50 bg-muted/20">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      Create tasks with project names to see project overview here. Start building your project portfolio!
                    </p>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Project
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project, index) => (
                    <div
                      key={project.name}
                      className="animate-in fade-in-50 slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    All Tasks
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Manage and track individual tasks across projects
                  </p>
                </div>
                <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border/50 px-3 py-1">
                  {tasks.length} tasks
                </Badge>
              </div>

              {tasks.length === 0 ? (
                <Card className="border-dashed border-2 border-border/50 bg-muted/20">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Tasks Yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      Create events with the "Task" category to see them here. Start organizing your work!
                    </p>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Task
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(tasksByStatus).map(([status, statusTasks], statusIndex) => (
                    statusTasks.length > 0 ? (
                      <div
                        key={status}
                        className="animate-in fade-in-50 slide-in-from-bottom-4"
                        style={{ animationDelay: `${statusIndex * 150}ms` }}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-4 h-4 rounded-full ${
                            status === 'done' ? 'bg-green-500' :
                            status === 'in_progress' ? 'bg-blue-500' :
                            status === 'blocked' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></div>
                          <h3 className="text-lg font-semibold capitalize">
                            {status.replace('_', ' ')} ({statusTasks.length})
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {statusTasks.map((task, taskIndex) => (
                            <div
                              key={task.id}
                              className="animate-in fade-in-50 slide-in-from-bottom-2"
                              style={{ animationDelay: `${(statusIndex * 150) + (taskIndex * 50)}ms` }}
                            >
                              <TaskCard task={task} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="gantt" className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Project Timeline
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Visual timeline with dependencies and critical paths
                  </p>
                </div>
                <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border/50 px-3 py-1">
                  {tasks.length} tasks
                </Badge>
              </div>

              <Suspense fallback={<div className="p-6 text-center">Loading Gantt chart…</div>}>
                <GanttChart
                  tasks={tasks}
                  onTaskClick={(task) => {
                    // Handle task click - could open task details modal
                    console.log('Task clicked:', task);
                  }}
                  onTaskUpdate={async (taskId, updates) => {
                    // Handle task updates
                    try {
                      await eventService.updateEvent(taskId, updates);
                      const updatedEvents = await eventService.loadEvents();
                      setEvents(updatedEvents);
                    } catch (error) {
                      console.error('Failed to update task:', error);
                    }
                  }}
                />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Project Modal */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your tasks and track progress.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={newProjectData.name}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={newProjectData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={newProjectData.startDate}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={newProjectData.endDate}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-color">Color</Label>
              <div className="flex gap-2">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${newProjectData.color === color ? 'border-primary' : 'border-muted'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewProjectData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProjectModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectData.name.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}