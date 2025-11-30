import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, differenceInDays } from "date-fns";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Repeat } from "lucide-react";
import { memo, useMemo, useCallback } from "react";
import EventCard from "./EventCard";

interface Event {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  category: string;
  color: string;
  isCompleted?: boolean;
  recurrenceRule?: string;
  parentId?: string;
  isRecurring?: boolean;
  isException?: boolean;
  recurrenceEnd?: Date;
  isAllDay?: boolean;
}

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDateClick: (date: Date) => void;
  onEventReschedule: (event: Event, newStartTime: Date, newEndTime: Date) => void;
  onShowMore: (day: Date, events: Event[]) => void;
  onDragEnd: (event: DragEndEvent) => void;
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
      className="absolute border rounded p-1 text-xs cursor-pointer pointer-events-auto hover:opacity-80 transition-opacity flex items-center gap-1 overflow-hidden min-w-0"
      style={dragStyle}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      {(event.isRecurring || event.parentId) && <Repeat className="h-3 w-3 flex-shrink-0" />}
      <span className="truncate min-w-0">{event.title}</span>
      <span className="ml-2 text-[10px] text-muted-foreground truncate">{event.category}</span>
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
      <MonthEventCard event={event} />
    </div>
  );
}

function MonthEventCard({ event }: { event: Event }) {
  const start = format(new Date(event.startTime), 'MMM d');
  const end = event.endTime ? format(new Date(event.endTime), 'MMM d') : '';

  return (
    <div className="w-full bg-white/90 dark:bg-gray-800/90 rounded-md px-2 py-2 shadow-sm border flex flex-col justify-between" style={{ overflow: 'visible' }}>
      <div className="flex items-start gap-2">
        <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: event.color || '#cbd5e1', marginTop: 6 }} className="flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium leading-snug whitespace-pre-wrap break-all">{event.title}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{start}{end ? ` — ${end}` : ''}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-[10px] text-muted-foreground truncate max-w-[60%]">{event.category}</div>
        <div className="flex-shrink-0">
          {event.isCompleted ? (
            <span className="text-[9px] bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded">Done</span>
          ) : (
            <span className="text-[9px] bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">Open</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(function MonthView({ currentDate, events, onEventClick, onDateClick, onEventReschedule, onShowMore, onDragEnd }: MonthViewProps) {
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);
  const calendarStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const calendarEnd = useMemo(() => endOfWeek(monthEnd), [monthEnd]);

  const days = useMemo(() => eachDayOfInterval({ start: calendarStart, end: calendarEnd }), [calendarStart, calendarEnd]);
  const weekDays = useMemo(() => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);

  const isMultiDayEvent = useCallback((event: Event) => {
    if (!event.endTime) return false;
    return differenceInDays(new Date(event.endTime), new Date(event.startTime)) > 0;
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    days.forEach(d => map.set(format(d, 'yyyy-MM-dd'), [] as Event[]));
    for (const event of events) {
      const start = new Date(event.startTime);
      const end = event.endTime ? new Date(event.endTime) : start;
      for (const day of days) {
        const key = format(day, 'yyyy-MM-dd');
        const arr = map.get(key)!;
        if (isSameDay(start, day) || (event.endTime && start <= day && end >= day)) {
          arr.push(event);
        }
      }
    }
    return map;
  }, [events, days]);

  const getEventSpanDays = (event: Event, days: Date[]) => {
    if (!event.endTime) return 1;
    const startDay = new Date(event.startTime);
    const endDay = new Date(event.endTime);
    const startIndex = days.findIndex(day => isSameDay(day, startDay));
    const endIndex = days.findIndex(day => isSameDay(day, endDay));
    if (startIndex === -1 || endIndex === -1) return 1;
    const span = Math.min(endIndex - startIndex + 1, days.length - startIndex);
    return Math.max(1, span);
  };

  // Chunk days into weeks (arrays of 7)
  const weeks = useMemo(() => {
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      out.push(days.slice(i, i + 7));
    }
    return out;
  }, [days]);

  // Build multi-day bars per week so they render above the week's cells and don't overlap cards
  const multiDayBarsPerWeek = useMemo(() => {
    const BAR_HEIGHT = 24;
    const GAP = 6;
    const cellWidth = 100 / 7;
    const result: { bars: JSX.Element[]; height: number }[] = [];

    for (let wi = 0; wi < weeks.length; wi++) {
      const week = weeks[wi];
      const rowOffsets: number[] = [];
      const bars: JSX.Element[] = [];

      for (const event of events) {
        if (!isMultiDayEvent(event)) continue;
        const start = new Date(event.startTime);
        const startIndex = days.findIndex(d => isSameDay(d, start));
        if (startIndex === -1) continue;
        const row = Math.floor(startIndex / 7);
        if (row !== wi) continue; // only bars that start in this week

        const spanDays = getEventSpanDays(event, days);
        const col = startIndex % 7;

        // find first free offset slot for this rowOffsets
        let offsetIndex = 0;
        while (rowOffsets[offsetIndex] && rowOffsets[offsetIndex] > col) {
          offsetIndex++;
        }
        const topOffset = offsetIndex * (BAR_HEIGHT + GAP);
        // mark occupied columns for this offset (simple approach)
        rowOffsets[offsetIndex] = (col + spanDays);

        bars.push(
          <DraggableEvent
            key={event.id}
            event={event}
            style={{
              position: 'absolute',
              left: `${col * cellWidth}%`,
              top: `${topOffset}px`,
              width: `${spanDays * cellWidth - 1}%`,
              height: `${BAR_HEIGHT}px`,
              backgroundColor: event.color || '#e0e0e0',
              borderRadius: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              color: '#fff',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '12px',
            }}
            onClick={() => onEventClick(event)}
          />
        );
      }

      const height = rowOffsets.length > 0 ? rowOffsets.length * (BAR_HEIGHT + GAP) : 0;
      result.push({ bars, height });
    }

    return result;
  }, [events, weeks, days, isMultiDayEvent]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-sm font-semibold text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {weeks.map((week, wi) => {
          const { bars, height } = multiDayBarsPerWeek[wi] || { bars: [], height: 0 };
          return (
            <div key={wi} className="border-b">
              <div style={{ position: 'relative', minHeight: height }} className="w-full">
                {bars}
              </div>
              <div className="grid grid-cols-7">
                {week.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const allEventsForDay: Event[] = eventsByDay.get(dayKey) || [];
                  const dayEvents: Event[] = allEventsForDay.filter((e: Event) => isSameDay(new Date(e.startTime), day) && !isMultiDayEvent(e));

                  return (
                    <DroppableCell key={idx} id={format(day, 'yyyy-MM-dd')} onClick={() => onDateClick(day)}>
                      <div
                        className={`min-h-[120px] p-2 border-r hover-elevate cursor-pointer ${!isCurrentMonth ? 'bg-muted/30' : ''}`}
                        data-testid={`cell-day-${format(day, 'yyyy-MM-dd')}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${!isCurrentMonth ? 'text-muted-foreground' : ''} ${isCurrentDay ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <DraggableEventCard key={event.id} event={event} onClick={() => onEventClick(event)} />
                          ))}
                          {allEventsForDay.length > 3 && (
                            <div
                              className="text-xs text-muted-foreground px-2 cursor-pointer hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); onShowMore(day, allEventsForDay); }}
                            >
                              +{allEventsForDay.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    </DroppableCell>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
