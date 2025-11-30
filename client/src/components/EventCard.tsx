import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle2, User, Flag, Tag } from "lucide-react";
import { format } from "date-fns";
import { memo } from "react";

interface EventCardProps {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  category: string;
  color: string;
  isCompleted?: boolean;
  isAllDay?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'done' | 'blocked' | 'cancelled';
  assignee?: string;
  project?: string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  onClick?: () => void;
}

export default memo(function EventCard({
  title,
  startTime,
  endTime,
  category,
  color,
  isCompleted,
  isAllDay,
  priority,
  status,
  assignee,
  project,
  tags,
  estimatedHours,
  actualHours,
  onClick
}: EventCardProps) {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      case 'blocked': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'cancelled': return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card
      className="p-3 cursor-pointer hover-elevate active-elevate-2 hover-scale smooth-transition overflow-hidden min-w-0 card-shadow card-shadow-hover"
      style={{ borderLeft: `4px solid ${color}` }}
      onClick={onClick}
      data-testid={`card-event-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <h3 className="text-sm font-medium truncate min-w-0" data-testid="text-event-title">
              {title}
            </h3>
            {priority && (
              <Flag className={`h-3 w-3 ${getPriorityColor(priority)}`} />
            )}
          </div>
          
          <div className="flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">
              {isAllDay ? 'All day' : `${format(startTime, 'h:mm a')} - ${endTime ? format(endTime, 'h:mm a') : ''}`}
            </span>
          </div>

          {(assignee || project) && (
            <div className="flex items-center gap-2 mb-1">
              {assignee && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{assignee}</span>
                </div>
              )}
              {project && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {project}
                </Badge>
              )}
            </div>
          )}

          {tags && tags.length > 0 && (
            <div className="flex items-center gap-1 mb-1">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <div className="flex gap-1 flex-wrap">
                {tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>
                )}
              </div>
            </div>
          )}

          {(estimatedHours || actualHours) && (
            <div className="text-xs text-muted-foreground">
              {estimatedHours && `Est: ${estimatedHours}h`}
              {estimatedHours && actualHours && ' • '}
              {actualHours && `Spent: ${actualHours}h`}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {isCompleted && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {status && status !== 'todo' && (
            <Badge className={`text-xs ${getStatusColor(status)}`}>
              {status.replace('_', ' ')}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        </div>
      </div>
    </Card>
  );
});
