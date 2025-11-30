import { format, startOfWeek, endOfWeek, eachDayOfInterval, eachHourOfInterval, startOfDay, endOfDay, isSameDay, isWithinInterval, differenceInDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { memo, useMemo, useCallback } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Repeat } from "lucide-react";
import { Event } from "@/lib/eventService";

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onEventReschedule?: (event: Event, newStartTime: Date, newEndTime: Date) => void;
  onDragEnd?: (event: DragEndEvent) => void;
}

function DraggableEvent({ event, style, onClick }: { event: Event; style: React.CSSProperties; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
  });

  const dragStyle = {
    ...style,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      className="absolute border rounded-lg p-2 text-xs cursor-pointer pointer-events-auto hover:opacity-80 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md overflow-hidden min-w-0"
      style={dragStyle}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      {(event.isRecurring || event.parentId) && <Repeat className="h-3 w-3 flex-shrink-0" />}
      <span className="font-medium truncate min-w-0">{event.title}</span>
      {event.category === 'Task' && event.status && (
        <span className="text-xs px-1 py-0.5 rounded bg-white/20 dark:bg-black/20 text-white">
          {event.status.replace('_', ' ')}
        </span>
      )}
    </div>
  );
}

function DroppableCell({ id, children, onClick }: { id: string; children: React.ReactNode; onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`${isOver ? 'bg-blue-100 dark:bg-blue-900/20' : ''}`}
    >
      {children}
    </div>
  );
}

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
      <Card className="p-1 mb-1 cursor-pointer overflow-hidden min-w-0" style={{ borderLeft: `3px solid ${event.color}` }}>
        <div className="text-xs font-medium truncate min-w-0">{event.title}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {format(new Date(event.startTime), 'h:mm a')}
        </div>
      </Card>
    </div>
  );
}

export default memo(function WeekView({ currentDate, events, onEventClick, onEventReschedule, onDragEnd }: WeekViewProps) {
  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate), [currentDate]);
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);
  
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  
  const isMultiDayEvent = useCallback((event: Event) => {
    if (!event.endTime) return false;
    return differenceInDays(new Date(event.endTime), new Date(event.startTime)) > 0;
  }, []);
  
  const getEventSpanDays = (event: Event, weekDays: Date[]) => {
    if (!event.endTime) return 1;
    const startDay = new Date(event.startTime);
    const endDay = new Date(event.endTime);
    const startIndex = weekDays.findIndex(day => isSameDay(day, startDay));
    const endIndex = weekDays.findIndex(day => isSameDay(day, endDay));
    if (startIndex === -1 || endIndex === -1) return 1;
    const span = Math.min(endIndex - startIndex + 1, weekDays.length - startIndex);
    return Math.max(1, span);
  };
  
  const eventsByDayHour = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const d of weekDays) {
      for (const h of hours) {
        map.set(`${format(d, 'yyyy-MM-dd')}-${h}`, []);
      }
    }
    for (const event of events) {
      if (event.isAllDay || !event.endTime) continue;
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      for (const d of weekDays) {
        if (!isSameDay(start, d)) continue;
        for (const h of hours) {
          const slotStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0);
          const slotEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 59);
          if (
            isWithinInterval(slotStart, { start, end }) ||
            isWithinInterval(slotEnd, { start, end }) ||
            (start <= slotStart && end >= slotEnd)
          ) {
            const key = `${format(d, 'yyyy-MM-dd')}-${h}`;
            map.get(key)!.push(event);
          }
        }
      }
    }
    return map;
  }, [events, weekDays, hours]);

  const getEventsForTimeSlot = useCallback((day: Date, hour: number) => {
    return eventsByDayHour.get(`${format(day, 'yyyy-MM-dd')}-${hour}`) || [];
  }, [eventsByDayHour]);
  
  const getMultiDayEventsForWeek = useCallback(() => events.filter(event => isMultiDayEvent(event)), [events, isMultiDayEvent]);

  const multiDayBars = useMemo(() => {
    const rowOffsets: { [row: number]: number } = {};
    return getMultiDayEventsForWeek().map(event => {
      const startDay = new Date(event.startTime);
      const startIndex = weekDays.findIndex(day => isSameDay(day, startDay));
      if (startIndex === -1) return null;
      const spanDays = getEventSpanDays(event, weekDays);
      const row = Math.floor(startIndex / 7);
      const col = startIndex % 7;
      const cellWidth = 100 / 7;
      const offset = rowOffsets[row] || 0;
      rowOffsets[row] = offset + 28;
      return (
        <DraggableEvent
          key={event.id}
          event={event}
          style={{
            left: `${col * cellWidth + 0.5}%`,
            top: `${row * 48 + 48 + offset + 2}px`,
            width: `${spanDays * cellWidth - 1}%`,
            height: '26px',
            backgroundColor: event.color || '#e0e0e0',
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            zIndex: 10,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            color: '#fff',
            fontSize: '12px',
          }}
          onClick={() => onEventClick(event)}
        />
      );
    }).filter(Boolean);
  }, [getMultiDayEventsForWeek, weekDays, onEventClick]);
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="relative flex-1 overflow-auto">
        <div className="absolute inset-0 pointer-events-none">
          {multiDayBars}
        </div>
        <div className="flex">
          <div className="w-16 flex-shrink-0 border-r">
            <div className="h-12 border-b" />
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b text-xs text-muted-foreground p-1 text-right">
                {format(new Date(2024, 0, 1, hour), 'h a')}
              </div>
            ))}
          </div>
          
          <DndContext onDragEnd={onDragEnd || (() => {})}>
            <div className="flex-1">
              <div className="grid grid-cols-7">
                {weekDays.map(day => (
                  <div key={day.toString()} className="border-r last:border-r-0">
                    <div className="h-12 border-b p-2 text-center">
                      <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                      <div className="text-sm font-semibold">{format(day, 'd')}</div>
                    </div>
                    {hours.map(hour => {
                      const slotEvents = getEventsForTimeSlot(day, hour);
                      return (
                        <DroppableCell key={hour} id={`${format(day, 'yyyy-MM-dd')}-${hour}`} onClick={() => {}}>
                          <div className="h-16 border-b p-1 hover-elevate" data-testid={`slot-${format(day, 'yyyy-MM-dd')}-${hour}`}>
                            {slotEvents.map(event => (
                              <DraggableEventCard key={event.id} event={event} onClick={() => onEventClick(event)} />
                            ))}
                          </div>
                        </DroppableCell>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
});
