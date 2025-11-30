import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { format } from "date-fns";

interface CalendarToolbarProps {
  currentDate: Date;
  view: 'month' | 'week' | 'day';
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: 'month' | 'week' | 'day') => void;
  onQuickAdd: () => void;
}

export default function CalendarToolbar({
  currentDate,
  view,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onQuickAdd
}: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevious}
          data-testid="button-previous"
          className="smooth-transition hover-scale"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={onToday}
          data-testid="button-today"
          className="smooth-transition hover-scale"
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          data-testid="button-next"
          className="smooth-transition hover-scale"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="ml-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold" data-testid="text-current-date">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-md">
          <Button
            variant={view === 'month' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('month')}
            data-testid="button-view-month"
            className="rounded-r-none smooth-transition hover-scale"
          >
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('week')}
            data-testid="button-view-week"
            className="rounded-none border-x smooth-transition hover-scale"
          >
            Week
          </Button>
          <Button
            variant={view === 'day' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('day')}
            data-testid="button-view-day"
            className="rounded-l-none smooth-transition hover-scale"
          >
            Day
          </Button>
        </div>
        
        <Button onClick={onQuickAdd} data-testid="button-quick-add" className="smooth-transition hover-scale button-focus-glow">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>
    </div>
  );
}
