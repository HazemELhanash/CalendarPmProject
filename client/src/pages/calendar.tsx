import { useState, useEffect, useMemo, useCallback } from "react";
import { addMonths, addWeeks, addDays, subMonths, subWeeks, subDays, startOfToday, format } from "date-fns";
import { DndContext, DragEndEvent, useDraggable } from "@dnd-kit/core";
import CalendarToolbar from "@/components/CalendarToolbar";
import MonthView from "@/components/MonthView";
import WeekView from "@/components/WeekView";
import DayView from "@/components/DayView";
import MiniCalendar from "@/components/MiniCalendar";
import CategoryFilter from "@/components/CategoryFilter";
import EventDetailPanel from "@/components/EventDetailPanel";
import QuickAddModal from "@/components/QuickAddModal";
import RecurringEventsSidebar from "@/components/RecurringEventsSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import TaskManagementSidebar from "@/components/TaskManagementSidebar";
import ProjectFilter from "@/components/ProjectFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EventCard from "@/components/EventCard";
import { eventService, Event } from "@/lib/eventService";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

// Local storage utilities - now handled by eventService
// Keeping for reference, but using service layer

function DraggableEventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
  });

  return (
      <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      {...listeners}
      {...attributes}
    >
      <EventCard {...event} />
    </div>
  );
}

// TODO: Remove mock data - this will be replaced with real API calls
const mockEvents = [
  {
    id: '1',
    title: 'Team Standup',
    description: 'Daily sync with the team',
    startTime: new Date(2024, 10, 15, 9, 0),
    endTime: new Date(2024, 10, 15, 9, 30),
    category: 'Meeting',
    color: '#3b82f6',
    isCompleted: false
  },
  {
    id: '2',
    title: 'Client Presentation',
    description: 'Q4 results presentation',
    startTime: new Date(2024, 10, 15, 14, 0),
    endTime: new Date(2024, 10, 15, 15, 30),
    category: 'Booking',
    color: '#10b981',
    isCompleted: false
  },
  {
    id: '3',
    title: 'Project Deadline',
    description: 'Submit final deliverables',
    startTime: new Date(2024, 10, 18, 17, 0),
    endTime: new Date(2024, 10, 18, 17, 0),
    category: 'Deadline',
    color: '#ef4444',
    isCompleted: false
  },
  {
    id: '4',
    title: 'Deep Work',
    description: 'Focus time for development',
    startTime: new Date(2024, 10, 16, 10, 0),
    endTime: new Date(2024, 10, 16, 12, 0),
    category: 'Focus Time',
    color: '#8b5cf6',
    isCompleted: false
  },
  {
    id: '5',
    title: 'Code Review Session',
    startTime: new Date(2024, 10, 19, 15, 0),
    endTime: new Date(2024, 10, 19, 16, 0),
    category: 'Meeting',
    color: '#3b82f6',
    isCompleted: false
  },
];

export default function CalendarPage() {
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<Event[]>([]);
  const [recurringParents, setRecurringParents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editContext, setEditContext] = useState<{ type: 'instance' | 'series' | 'future' | null; event?: Event | null }>({ type: null, event: null });
  const [modalInitialData, setModalInitialData] = useState<any>(null);
  const [showMoreModal, setShowMoreModal] = useState<{ isOpen: boolean; day: Date | null; events: Event[] }>({ isOpen: false, day: null, events: [] });

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

  const reloadData = async () => {
    const loadedEvents = await eventService.loadEvents();
    setEvents(loadedEvents);
    const parents = await eventService.getRecurringParents();
    setRecurringParents(parents);
  };

  // Save events to storage whenever events change
  // Note: Do not auto-save `events` here because `events` contains generated instances.
  // Raw parents/exceptions are written directly by the service methods.
  
  // TODO: Remove mock categories - this will be fetched from API
  const [categories, setCategories] = useState([
    { name: 'Meeting', color: '#3b82f6', active: true },
    { name: 'Booking', color: '#10b981', active: true },
    { name: 'Focus Time', color: '#8b5cf6', active: true },
    { name: 'Personal', color: '#f59e0b', active: true },
    { name: 'Task', color: '#ef4444', active: true },
  ]);
  
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const category = categories.find(cat => cat.name === event.category);
      const categoryMatch = category?.active ?? true;
      const projectMatch = selectedProjects.length === 0 || !event.project || selectedProjects.includes(event.project);
      return categoryMatch && projectMatch;
    });
  }, [events, categories, selectedProjects]);
  
  const availableProjects = useMemo(() => {
    const projects = new Set(events.map(event => event.project).filter((project): project is string => Boolean(project)));
    return Array.from(projects).sort();
  }, [events]);
  
  const handlePrevious = useCallback(() => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  }, [view, currentDate]);

  const handleNext = useCallback(() => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  }, [view, currentDate]);

  const handleToday = useCallback(() => {
    setCurrentDate(startOfToday());
  }, []);

  const handleEventClick = useCallback((event: any) => {
    setSelectedEvent(event);
    setIsPanelOpen(true);
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setView('day');
  }, []);
  
  const handleQuickAdd = async (formData: any) => {
    // If editing context exists, we treat this as an edit submission
    if (editContext.event && !editContext.type) {
      // Single event edit (non-recurring or editing a specific generated instance as standalone)
      const target = editContext.event;
      const startTime = new Date(`${formData.startDate}T${formData.startTime}`);
      let endTime: Date | undefined;
      if (formData.endDate && formData.endTime) {
        endTime = new Date(`${formData.endDate}T${formData.endTime}`);
      } else {
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      }
      const updates: any = {
        title: formData.title,
        description: formData.description,
        startTime,
        endTime,
        category: formData.category,
        color: formData.color,
        isAllDay: formData.isAllDay,
        priority: formData.priority,
        status: formData.status,
        assignee: formData.assignee,
        project: formData.project,
        tags: formData.tags,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        subtasks: formData.subtasks,
      };
      const updated = await eventService.updateEvent(target.id, updates);
      if (updated) {
        setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      }
      setEditContext({ type: null, event: null });
      await reloadData();
      return;
    }

    if (editContext.type && editContext.event) {
      const target = editContext.event;
      if (editContext.type === 'instance') {
        // Create exception for this occurrence and create standalone event with new data
        // createException expects an object without an `id` property
        const exceptionPayload = { ...target } as any;
        delete exceptionPayload.id;
        exceptionPayload.parentId = target.parentId || target.id;
        exceptionPayload.isException = true;
        exceptionPayload.isSkipped = true;
        await eventService.createException(exceptionPayload);

        const startTime = new Date(`${formData.startDate}T${formData.startTime}`);
        let endTime: Date | undefined;
        if (formData.endDate && formData.endTime) {
          endTime = new Date(`${formData.endDate}T${formData.endTime}`);
        } else {
          endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        }

        const newEvent = await eventService.createEvent({
          title: formData.title,
          description: formData.description,
          startTime,
          endTime,
          category: formData.category,
          color: formData.color,
          isCompleted: false,
          isAllDay: formData.isAllDay,
          priority: formData.priority,
          status: formData.status,
          assignee: formData.assignee,
          project: formData.project,
          tags: formData.tags,
          estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
          subtasks: formData.subtasks,
        });

        await reloadData();
        setEditContext({ type: null, event: null });
        return;
      }

      if (editContext.type === 'series') {
        // Apply edits to the parent series (we'll update parent event fields)
        const parentId = target.parentId || target.id;
        const updates: any = {
          title: formData.title,
          description: formData.description,
          color: formData.color,
          category: formData.category,
          priority: formData.priority,
          status: formData.status,
          assignee: formData.assignee,
          project: formData.project,
        };
        await eventService.updateRecurringSeries(parentId, updates);
        await reloadData();
        setEditContext({ type: null, event: null });
        return;
      }

      if (editContext.type === 'future') {
        // Edit this and future occurrences: split the series
        // Implementation approach: update the existing parent to end before this occurrence,
        // and create a new recurring parent starting at this occurrence with updated data.
        const parentId = target.parentId || target.id;
        const occurrenceStart = new Date(target.startTime);

        // 1) Update existing parent to end before the occurrence
        await eventService.updateRecurringSeries(parentId, { recurrenceEnd: new Date(occurrenceStart.getTime() - 1000) });

        // 2) Create a new recurring parent starting from occurrenceStart with same recurrenceRule
        // We need to read the parent to get recurrenceRule and other fields
        const parents = await eventService.getRecurringParents();
        const oldParent = parents.find(p => p.id === parentId);
        if (oldParent && oldParent.recurrenceRule) {
          const computedStart = new Date(`${formData.startDate}T${formData.startTime}`) || occurrenceStart;
          let computedEnd: Date | undefined;
          if (formData.endDate && formData.endTime) {
            computedEnd = new Date(`${formData.endDate}T${formData.endTime}`);
          } else if (oldParent.endTime) {
            computedEnd = new Date(oldParent.endTime);
          } else {
            computedEnd = new Date(computedStart.getTime() + 60 * 60 * 1000);
          }

          const newParentData: any = {
            title: formData.title || oldParent.title,
            description: formData.description || oldParent.description,
            startTime: computedStart,
            endTime: computedEnd,
            category: formData.category || oldParent.category,
            color: formData.color || oldParent.color,
            isAllDay: formData.isAllDay ?? oldParent.isAllDay,
          };

          await eventService.createRecurringEvent(newParentData, oldParent.recurrenceRule || '', oldParent.recurrenceEnd);
          await reloadData();
        }

        setEditContext({ type: null, event: null });
        return;
      }
    }
    // TODO: Replace with API call
    const startTime = new Date(`${formData.startDate}T${formData.startTime}`);
    let endTime: Date | undefined;
    if (formData.endDate && formData.endTime) {
      endTime = new Date(`${formData.endDate}T${formData.endTime}`);
    } else {
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    }
    
    if (formData.isRecurring) {
      // Generate RRULE
      let freq: string;
      switch (formData.recurrenceFrequency) {
        case 'daily': freq = 'DAILY'; break;
        case 'weekly': freq = 'WEEKLY'; break;
        case 'monthly': freq = 'MONTHLY'; break;
        case 'yearly': freq = 'YEARLY'; break;
        case 'custom': freq = 'WEEKLY;INTERVAL=2'; break;
        default: freq = 'WEEKLY';
      }
      const recurrenceRule = `FREQ=${freq}`; // store the rule only; dtstart will be applied when generating instances
      
      let recurrenceEnd: Date | undefined;
      if (formData.recurrenceEnd === '1year') {
        recurrenceEnd = addDays(startTime, 365);
      } else if (formData.recurrenceEnd === '1month') {
        recurrenceEnd = addDays(startTime, 30);
      }
      
      await eventService.createRecurringEvent({
        title: formData.title,
        description: formData.description,
        startTime,
        endTime,
        category: formData.category,
        color: formData.color,
        isCompleted: false,
        isAllDay: formData.isAllDay,
        priority: formData.priority,
        status: formData.status,
        assignee: formData.assignee,
        project: formData.project,
        tags: formData.tags,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        subtasks: formData.subtasks,
      }, recurrenceRule, recurrenceEnd);
      // Reload to generate instances
      await reloadData();
      // Celebrate!
      const parents = await eventService.getRecurringParents();
      setRecurringParents(parents);
    } else {
      const newEvent = await eventService.createEvent({
        title: formData.title,
        description: formData.description,
        startTime,
        endTime,
        category: formData.category,
        color: formData.color,
        isCompleted: false,
        isAllDay: formData.isAllDay,
        priority: formData.priority,
        status: formData.status,
        assignee: formData.assignee,
        project: formData.project,
        tags: formData.tags,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        subtasks: formData.subtasks,
      });
      setEvents(prev => [...prev, newEvent]);
      // Celebrate!
    }
  };
  
  const handleEditEvent = async (event: any, editType?: 'instance' | 'series' | 'future') => {
    // Build initialData for modal (used for both recurring edits and single-event edits)
    const initialData = {
      title: event.title,
      description: event.description,
      startDate: format(new Date(event.startTime), 'yyyy-MM-dd'),
      startTime: format(new Date(event.startTime), 'HH:mm'),
      endDate: event.endTime ? format(new Date(event.endTime), 'yyyy-MM-dd') : format(new Date(event.startTime), 'yyyy-MM-dd'),
      endTime: event.endTime ? format(new Date(event.endTime), 'HH:mm') : format(new Date(event.startTime), 'HH:mm'),
      category: event.category,
      color: event.color,
      isAllDay: event.isAllDay || false,
      isRecurring: Boolean(event.recurrenceRule || event.parentId),
      recurrenceFrequency: event.recurrenceRule || 'none',
      recurrenceEnd: event.recurrenceEnd ? format(new Date(event.recurrenceEnd), 'yyyy-MM-dd') : '',
      priority: event.priority,
      status: event.status,
      assignee: event.assignee,
      project: event.project,
      tags: event.tags || [],
      estimatedHours: event.estimatedHours ? String(event.estimatedHours) : '',
      subtasks: event.subtasks || [],
    };

    // Set edit context and open modal for editing. If editType is provided (from recurring dialog), record it; otherwise null means single-event edit.
    setEditContext({ type: editType ?? null, event });
    setModalInitialData(initialData);
    setIsQuickAddOpen(true);
    setIsPanelOpen(false);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    // Find the event in current UI state
    const target = events.find(e => e.id === eventId);
    if (!target) return;

    // If this is a generated recurring instance, create a skipped exception instead
    if (target.parentId) {
      // Build payload without `id` to satisfy Omit<Event,'id'>
      const { id, ...rest } = target as any;
      const exceptionPayload: any = {
        ...rest,
        parentId: target.parentId,
        isSkipped: true,
      };
      await eventService.createException(exceptionPayload);
      // Refresh all data to remove generated instance
      await reloadData();
      return;
    }

    // Otherwise delete the raw event (parent or single event) and reload
    const success = await eventService.deleteEvent(eventId);
    if (success) {
      await reloadData();
    }
  };
  
  const handleToggleComplete = async (eventId: string) => {
    // Update the raw event on storage and reload UI so all consumers (sidebar, projects) update
    const current = events.find(e => e.id === eventId);
    if (!current) return;
    const updatedEvent = await eventService.updateEvent(eventId, { isCompleted: !current.isCompleted, status: !current.isCompleted ? 'done' : 'todo' });
    if (updatedEvent) {
      // reload all generated instances and parents
      await reloadData();
    }
  };
  
  const handleEventReschedule = async (event: Event, newStartTime: Date, newEndTime: Date) => {
    if (event.parentId) {
      // For recurring instances: mark the original occurrence as skipped (exception)
      // and create a new standalone event at the new time.
      // This avoids duplicating generated instances in storage.

      // 1) Create a skipped exception for the original occurrence
      await eventService.createException({
        ...event,
        startTime: event.startTime,
        endTime: event.endTime,
        parentId: event.parentId,
        isSkipped: true,
      });

      // 2) Create a new event representing the moved instance
      const newEvent = await eventService.createEvent({
        ...event,
        startTime: newStartTime,
        endTime: newEndTime,
        parentId: undefined,
        isRecurring: false,
        isException: false,
      });

      // 3) Update local `events`: remove the generated instance (by id)
      //    and insert the newly-created event at the same index so UI layout/order stays consistent
      const idx = events.findIndex(e => e.id === event.id);
      const cleaned = events.filter(e => e.id !== event.id);
      setEvents(prev => {
        const idxLocal = prev.findIndex(e => e.id === event.id);
        const cleanedLocal = prev.filter(e => e.id !== event.id);
        if (idxLocal === -1) return [...cleanedLocal, newEvent];
        const beforeLocal = cleanedLocal.slice(0, idxLocal);
        const afterLocal = cleanedLocal.slice(idxLocal);
        return [...beforeLocal, newEvent, ...afterLocal];
      });

      // 4) Reload in background to ensure generated instances and parents are consistent
      reloadData();
    } else {
      // Regular event
      const updatedEvent = await eventService.updateEvent(event.id, { startTime: newStartTime, endTime: newEndTime });
      if (updatedEvent) {
        setEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e));
      }
    }
  };
  
  const handleShowMore = (day: Date, events: any[]) => {
    setShowMoreModal({ isOpen: true, day, events });
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const draggedEventId = active.id as string;
    const targetDateStr = over.id as string;
    // Parse droppable id which may be 'yyyy-MM-dd' or 'yyyy-MM-dd-hour'
    let targetDate: Date;
    const parts = targetDateStr.split('-');
    if (parts.length === 3) {
      // yyyy-MM-dd
      targetDate = new Date(targetDateStr);
    } else if (parts.length >= 4) {
      // yyyy-MM-dd-hour (or additional suffixes) -> parse explicitly
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const hour = parseInt(parts[3], 10);
      targetDate = new Date(year, month, day, hour || 0, 0, 0, 0);
    } else {
      targetDate = new Date(targetDateStr);
    }
    
    const draggedEvent = events.find(e => e.id === draggedEventId);
    if (!draggedEvent) return;
    
    const originalStart = new Date(draggedEvent.startTime);
    const originalEnd = draggedEvent.endTime ? new Date(draggedEvent.endTime) : new Date(originalStart.getTime() + 3600000); // Default 1 hour
    const duration = originalEnd.getTime() - originalStart.getTime();
    
    const newStart = new Date(targetDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes());
    const newEnd = new Date(newStart.getTime() + duration);
    
    handleEventReschedule(draggedEvent, newStart, newEnd);
  };
  
  const handleCategoryToggle = (categoryName: string) => {
    setCategories(prev => prev.map(cat =>
      cat.name === categoryName ? { ...cat, active: !cat.active } : cat
    ));
  };
  
  const handleProjectToggle = (project: string) => {
    setSelectedProjects(prev => 
      prev.includes(project) 
        ? prev.filter(p => p !== project)
        : [...prev, project]
    );
  };
  
  const handleClearProjectFilters = () => {
    setSelectedProjects([]);
  };
  
  const eventDates = useMemo(() => events.map(e => new Date(e.startTime)), [events]);
  
  return (
    <div className="flex h-screen overflow-hidden subtle-dots">
      {/* Sidebar */}
      <div className="w-[280px] flex-shrink-0 border-r flex flex-col bg-card card-shadow overflow-y-auto scroll-smooth">
        <div className="p-4 border-b flex items-center justify-between soft-border">
          <h1 className="text-xl font-semibold text-balance" data-testid="text-app-title">📅 Calendar PM</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/projects')}
              className="text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Projects
            </Button>
            <ThemeToggle />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <MiniCalendar
              selectedDate={currentDate}
              onDateSelect={(date) => setCurrentDate(date)}
              eventDates={eventDates}
            />
          </div>
          
          <div className="border-t p-4">
            <CategoryFilter
              categories={categories}
              onToggle={handleCategoryToggle}
            />
          </div>
          
          {availableProjects.length > 0 && (
            <div className="border-t p-4">
              <ProjectFilter
                projects={availableProjects}
                selectedProjects={selectedProjects}
                onToggleProject={handleProjectToggle}
                onClearAll={handleClearProjectFilters}
              />
            </div>
          )}
          
          <div className="border-t p-4">
            <TaskManagementSidebar
              events={events}
              onTaskClick={handleEventClick}
              onStatusChange={async (eventId, newStatus) => {
                const updatedEvent = await eventService.updateEvent(eventId, { status: newStatus as any });
                if (updatedEvent) {
                  setEvents(events.map(e => e.id === eventId ? updatedEvent : e));
                }
              }}
            />
          </div>
          
          <div className="border-t p-4">
            <RecurringEventsSidebar
              recurringEvents={recurringParents}
              onStopSeries={async (parentId) => {
                const success = await eventService.stopRecurringSeries(parentId);
                if (success) {
                  await reloadData();
                }
              }}
              onReload={reloadData}
            />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="card-shadow">
          <CalendarToolbar
            currentDate={currentDate}
            view={view}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
            onViewChange={setView}
            onQuickAdd={() => setIsQuickAddOpen(true)}
          />
        </div>
        
        <div className="flex-1 overflow-auto bg-background scroll-smooth">
          <DndContext onDragEnd={handleDragEnd}>
            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onEventReschedule={handleEventReschedule}
                onShowMore={handleShowMore}
                onDragEnd={handleDragEnd}
              />
            )}
            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onEventReschedule={handleEventReschedule}
                onDragEnd={handleDragEnd}
              />
            )}
            {view === 'day' && (
              <DayView
                currentDate={currentDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onEventReschedule={handleEventReschedule}
              />
            )}
          </DndContext>
        </div>
      </div>
      
      {/* Event Detail Panel */}
      <EventDetailPanel
        event={selectedEvent}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onToggleComplete={handleToggleComplete}
      />
      
      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => { setIsQuickAddOpen(false); setModalInitialData(null); setEditContext({ type: null, event: null }); }}
        onSubmit={handleQuickAdd}
        initialData={modalInitialData}
      />
      
      {/* Show More Modal */}
      <Dialog open={showMoreModal.isOpen} onOpenChange={(open) => setShowMoreModal({ ...showMoreModal, isOpen: open })}>
        <DialogContent className="max-w-md fade-in">
          <DialogHeader>
            <DialogTitle>
              Events on {showMoreModal.day ? format(showMoreModal.day, 'MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {showMoreModal.events.map(event => (
              <DraggableEventCard key={event.id} event={event} onClick={() => handleEventClick(event)} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
