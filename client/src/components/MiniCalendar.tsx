import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { useState, useMemo } from "react";

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  eventDates?: Date[];
}

export default function MiniCalendar({ selectedDate, onDateSelect, eventDates = [] }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const calendarStart = useMemo(() => startOfWeek(monthStart), [monthStart]);
  const calendarEnd = useMemo(() => endOfWeek(monthEnd), [monthEnd]);

  const days = useMemo(() => eachDayOfInterval({ start: calendarStart, end: calendarEnd }), [calendarStart, calendarEnd]);
  const weekDays = useMemo(() => ['S', 'M', 'T', 'W', 'T', 'F', 'S'], []);

  const eventSet = useMemo(() => new Set(eventDates.map(d => format(d, 'yyyy-MM-dd'))), [eventDates]);
  const hasEvent = (date: Date) => eventSet.has(format(date, 'yyyy-MM-dd'));
  
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">
          {format(currentMonth, 'MMM yyyy')}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 smooth-transition hover-scale"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            data-testid="button-mini-prev"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 smooth-transition hover-scale"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            data-testid="button-mini-next"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-xs text-muted-foreground text-center font-medium">
            {day}
          </div>
        ))}
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const hasEventOnDay = hasEvent(day);
          
          return (
            <button
              key={idx}
              onClick={() => onDateSelect(day)}
              className={`
                relative h-7 w-full text-xs rounded-md hover-elevate active-elevate-2 smooth-transition hover-scale
                ${!isCurrentMonth ? 'text-muted-foreground/40' : ''}
                ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                ${isCurrentDay && !isSelected ? 'font-bold text-primary' : ''}
              `}
              data-testid={`button-date-${format(day, 'yyyy-MM-dd')}`}
            >
              {format(day, 'd')}
              {hasEventOnDay && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
