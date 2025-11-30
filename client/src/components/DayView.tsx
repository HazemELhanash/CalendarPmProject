import { format, eachHourOfInterval, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Card } from "@/components/ui/card";
import { memo, useMemo, useCallback, ReactNode } from "react";
import { DndContext, DragEndEvent, useDroppable } from "@dnd-kit/core";

interface Event {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  category: string;
  description?: string;
  color: string;
  isCompleted?: boolean;
  recurrenceRule?: string;
  parentId?: string;
  isRecurring?: boolean;
  isException?: boolean;
  recurrenceEnd?: Date;
  isAllDay?: boolean;
}

interface DayViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventReschedule?: (event: Event, newStartTime: Date, newEndTime: Date) => void;
}

export default memo(function DayView({ currentDate, events, onEventClick, onEventReschedule }: DayViewProps) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  
  const eventsByHour = useMemo(() => {
    const map = new Map<number, Event[]>();
    for (let h = 0; h < 24; h++) map.set(h, []);
    for (const event of events) {
      if (event.isAllDay || !event.endTime) continue;
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      if (!isWithinInterval(start, { start: startOfDay(currentDate), end: endOfDay(currentDate) }) && !isWithinInterval(end, { start: startOfDay(currentDate), end: endOfDay(currentDate) })) continue;
      for (let h = 0; h < 24; h++) {
        const slotStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), h, 0);
        const slotEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), h, 59);
        if (
          (isWithinInterval(slotStart, { start, end })) ||
          (isWithinInterval(slotEnd, { start, end })) ||
          (start <= slotStart && end >= slotEnd)
        ) {
          map.get(h)!.push(event);
        }
      }
    }
    return map;
  }, [events, currentDate]);

  const getEventsForTimeSlot = useCallback((hour: number) => {
    return eventsByHour.get(hour) || [];
  }, [eventsByHour]);
  
  const allDayEvents = useMemo(() => events.filter(event => event.isAllDay), [events]);
  
  function DroppableSlot({ id, children }: { id: string; children: ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
      <div ref={setNodeRef} className={`${isOver ? 'bg-blue-100 dark:bg-blue-900/20' : ''} h-full`}>{children}</div>
    );
  }

  return (
    <DndContext onDragEnd={(e: DragEndEvent) => {
      const { active, over } = e;
      if (!over) return;
      const draggedId = String(active.id);
      const overId = String(over.id);
      // parse id format: yyyy-MM-dd-hour
      const parts = overId.split('-');
      if (parts.length >= 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const hour = parseInt(parts[3], 10);
        const targetStart = new Date(year, month, day, hour, 0, 0, 0);
        const draggedEvent = events.find(ev => ev.id === draggedId);
        if (draggedEvent && typeof onEventReschedule === 'function') {
          const duration = draggedEvent.endTime ? (new Date(draggedEvent.endTime).getTime() - new Date(draggedEvent.startTime).getTime()) : 3600000;
          const targetEnd = new Date(targetStart.getTime() + duration);
          onEventReschedule(draggedEvent, targetStart, targetEnd);
        }
      }
    }}>
    <div className="flex-1 flex flex-col overflow-hidden">
      {allDayEvents.length > 0 && (
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium mb-2">All-day</h3>
          <div className="space-y-2">
            {allDayEvents.map(event => (
              <Card
                key={event.id}
                className="p-2 cursor-pointer"
                style={{ borderLeft: `4px solid ${event.color}` }}
                onClick={() => onEventClick(event)}
              >
                <div className="font-medium text-sm">{event.title}</div>
                {event.description && (
                  <div className="text-xs text-muted-foreground mt-1">{event.description}</div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
      <div className="flex overflow-hidden">
        <div className="w-20 flex-shrink-0 border-r">
          {hours.map(hour => (
            <div key={hour} className="h-20 border-b text-sm text-muted-foreground p-2 text-right">
              {format(new Date(2024, 0, 1, hour), 'h a')}
            </div>
          ))}
        </div>
      
      <div className="flex-1 overflow-auto">
          {hours.map(hour => {
          const slotEvents = getEventsForTimeSlot(hour);
          const slotId = `${format(currentDate, 'yyyy-MM-dd')}-${hour}`;
          return (
            <div key={hour} className="h-20 border-b p-2 hover-elevate">
              <DroppableSlot id={slotId}>
                <div data-testid={`slot-${slotId}`} className="h-full">
                  {slotEvents.map(event => (
                    <div key={event.id} data-id={event.id} className="mb-2">
                      <Card
                        className="p-2 cursor-pointer overflow-hidden min-w-0"
                        style={{ borderLeft: `4px solid ${event.color}` }}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="font-medium text-sm truncate min-w-0">{event.title}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">
                          {event.isAllDay ? 'All day' : `${format(new Date(event.startTime), 'h:mm a')} - ${event.endTime ? format(new Date(event.endTime), 'h:mm a') : ''}`}
                        </div>
                        {event.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </div>
                        )}
                      </Card>
                    </div>
                  ))}
                </div>
              </DroppableSlot>
            </div>
          );
        })}
      </div>
      </div>
    </div>
    </DndContext>
  );
});
