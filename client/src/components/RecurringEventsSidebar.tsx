import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Event, eventService } from "@/lib/eventService";
import { useState } from "react";
import { Repeat, Calendar, Clock, Trash2 } from "lucide-react";

interface RecurringEventsSidebarProps {
  recurringEvents: Event[];
  onStopSeries: (parentId: string) => void;
  onReload: () => void;
}

// Helper function to parse recurrence rule and extract pattern and interval
function parseRecurrenceRule(recurrenceRule?: string) {
  if (!recurrenceRule) return { pattern: 'Daily', interval: 1 };

  try {
    // Parse RRULE string like "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR"
    const parts = recurrenceRule.split(';');
    let freq = 'DAILY';
    let interval = 1;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'FREQ') freq = value;
      if (key === 'INTERVAL') interval = parseInt(value) || 1;
    }

    // Convert FREQ to readable pattern
    const patternMap: Record<string, string> = {
      'DAILY': 'Daily',
      'WEEKLY': 'Weekly',
      'MONTHLY': 'Monthly',
      'YEARLY': 'Yearly'
    };

    return {
      pattern: patternMap[freq] || 'Daily',
      interval: interval
    };
  } catch (error) {
    return { pattern: 'Daily', interval: 1 };
  }
}

export default function RecurringEventsSidebar({
  recurringEvents,
  onStopSeries,
  onReload,
}: RecurringEventsSidebarProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  return (
    <div className="p-4 space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 text-white shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="h-5 w-5" />
            <h3 className="font-semibold">Recurring Events</h3>
          </div>
          <p className="text-sm opacity-90">"Stay organized, stay ahead!"</p>
        </div>
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      </div>

      <Accordion type="single" collapsible defaultValue="recurring">
        <AccordionItem value="recurring" className="border-0">
          <AccordionTrigger className="text-sm font-medium hover:no-underline px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recurring Events
              <Badge variant="secondary" className="ml-2">
                {recurringEvents.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-1">
            <div className="space-y-3 mt-3">
              {recurringEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Repeat className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recurring events</p>
                </div>
              ) : (
                recurringEvents.map((event) => {
                  const recurrence = parseRecurrenceRule(event.recurrenceRule);
                  return (
                  <Card key={event.id} className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium leading-tight">
                            {event.title}
                          </CardTitle>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {recurrence.pattern}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {recurrence.interval}x
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          setLoadingId(event.id);
                          await onStopSeries(event.id);
                          setLoadingId(null);
                        }}
                        className={`w-full transition-all duration-200 hover:scale-105 ${
                          loadingId === event.id
                            ? 'animate-pulse bg-red-400'
                            : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                        } text-white border-0 shadow-sm hover:shadow-md`}
                        disabled={loadingId === event.id}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        {loadingId === event.id ? 'Stopping...' : 'Stop Series'}
                      </Button>
                    </CardContent>
                  </Card>
                  );
                })
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}