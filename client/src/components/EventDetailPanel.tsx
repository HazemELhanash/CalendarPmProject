import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Pencil, Trash2, Clock, Calendar, CheckCircle2, Repeat, User, Flag, Tag, Timer } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useMemo } from "react";

interface Event {
  id: string;
  title: string;
  description?: string;
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
  // Project Management fields
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'done' | 'blocked' | 'cancelled';
  assignee?: string;
  project?: string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  subtasks?: {id: string, title: string, completed: boolean}[];
  comments?: {id: string, author: string, content: string, timestamp: string}[];
}

interface EventDetailPanelProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: Event, editType?: 'instance' | 'series' | 'future') => void;
  onDelete: (eventId: string) => void;
  onToggleComplete?: (eventId: string) => void;
}

export default function EventDetailPanel({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
}: EventDetailPanelProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const formattedDate = useMemo(() => {
    if (!event) return '';
    return format(new Date(event.startTime), 'EEEE, MMMM d, yyyy');
  }, [event?.startTime]);

  const formattedTimeRange = useMemo(() => {
    if (!event) return '';
    return event.isAllDay ? 'All day' : `${format(new Date(event.startTime), 'h:mm a')} - ${event.endTime ? format(new Date(event.endTime), 'h:mm a') : ''}`;
  }, [event?.startTime, event?.endTime, event?.isAllDay]);

  if (!isOpen || !event) return null;
  
  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-card border-l shadow-lg z-50 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Event Details</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-close-panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold" data-testid="text-event-detail-title">
              {event.title}
            </h3>
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: event.color }}
            />
          </div>
          <Badge variant="secondary">{event.category}</Badge>
        </div>
        
        {event.description && (
          <div>
            <h4 className="text-sm font-medium mb-1 text-muted-foreground">Description</h4>
            <p className="text-sm" data-testid="text-event-description">{event.description}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formattedDate}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono">{formattedTimeRange}</span>
          </div>
          
          {(event.isRecurring || event.parentId) && (
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Recurring event</span>
            </div>
          )}
        </div>
        
        {onToggleComplete && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onToggleComplete(event.id)}
            data-testid="button-toggle-complete"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {event.isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
          </Button>
        )}

        {/* Project Management Information */}
        {(event.priority || event.status || event.assignee || event.project || event.tags || event.estimatedHours || event.actualHours || event.subtasks) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Project Management</h4>
            
            <div className="space-y-3">
              {(event.priority || event.status) && (
                <div className="flex items-center justify-between">
                  {event.priority && (
                    <div className="flex items-center gap-2">
                      <Flag className={`h-4 w-4 ${
                        event.priority === 'urgent' ? 'text-red-500' :
                        event.priority === 'high' ? 'text-orange-500' :
                        event.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
                      }`} />
                      <span className="text-sm capitalize">{event.priority} Priority</span>
                    </div>
                  )}
                  
                  {event.status && event.status !== 'todo' && (
                    <Badge variant="secondary" className={`text-xs ${
                      event.status === 'done' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
                      event.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' :
                      event.status === 'blocked' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' : 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
                    }`}>
                      {event.status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              )}

              {(event.assignee || event.project) && (
                <div className="space-y-2">
                  {event.assignee && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Assigned to: {event.assignee}</span>
                    </div>
                  )}
                  
                  {event.project && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {event.project}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {(event.estimatedHours || event.actualHours) && (
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {event.estimatedHours && `Est: ${event.estimatedHours}h`}
                    {event.estimatedHours && event.actualHours && ' • '}
                    {event.actualHours && `Spent: ${event.actualHours}h`}
                  </span>
                </div>
              )}

              {event.tags && event.tags.length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {event.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {event.subtasks && event.subtasks.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Subtasks</h5>
                  <div className="space-y-1">
                    {event.subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          readOnly
                          className="rounded"
                        />
                        <span className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            if (event.isRecurring || event.parentId) {
              setShowEditDialog(true);
            } else {
              onEdit(event);
            }
          }}
          data-testid="button-edit-event"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => {
            onDelete(event.id);
            onClose();
          }}
          data-testid="button-delete-event"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recurring Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Do you want to edit this instance or the entire series?
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onEdit(event, 'instance');
                  setShowEditDialog(false);
                  onClose();
                }}
                className="flex-1"
              >
                This Instance
              </Button>
              <Button
                onClick={() => {
                  onEdit(event, 'series');
                  setShowEditDialog(false);
                  onClose();
                }}
                className="flex-1"
                variant="outline"
              >
                Entire Series
              </Button>
              <Button
                onClick={() => {
                  onEdit(event, 'future');
                  setShowEditDialog(false);
                  onClose();
                }}
                className="flex-1"
                variant="ghost"
              >
                This and Future
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
