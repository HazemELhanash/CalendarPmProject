import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { X, Plus } from "lucide-react";

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  category: string;
  color: string;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceFrequency: string;
  recurrenceEnd: string;
  // PM fields
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'cancelled';
  assignee: string;
  project: string;
  tags: string[];
  estimatedHours: string;
  subtasks: { id: string; title: string; completed: boolean }[];
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
}

const categories = [
  { name: 'Meeting', color: '#3b82f6' },
  { name: 'Booking', color: '#10b981' },
  { name: 'Focus Time', color: '#8b5cf6' },
  { name: 'Personal', color: '#f59e0b' },
  { name: 'Task', color: '#ef4444' },
];

export default function EventForm({ initialData, onSubmit, onCancel }: EventFormProps) {
  const now = new Date();
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate || format(now, 'yyyy-MM-dd'),
    startTime: initialData?.startTime || format(now, 'HH:mm'),
    endDate: initialData?.endDate || format(now, 'yyyy-MM-dd'),
    endTime: initialData?.endTime || format(new Date(now.getTime() + 3600000), 'HH:mm'),
    category: initialData?.category || 'Meeting',
    color: initialData?.color || (initialData?.category ? (categories.find(c => c.name === initialData?.category)?.color || '#3b82f6') : '#3b82f6'),
    isAllDay: initialData?.isAllDay || false,
    isRecurring: initialData?.isRecurring || false,
    recurrenceFrequency: initialData?.recurrenceFrequency || 'none',
    recurrenceEnd: initialData?.recurrenceEnd || '',
    // PM fields
    priority: initialData?.priority || 'medium',
    status: initialData?.status || 'todo',
    assignee: initialData?.assignee || '',
    project: initialData?.project || '',
    tags: initialData?.tags || [],
    estimatedHours: initialData?.estimatedHours || '',
    subtasks: initialData?.subtasks || [],
  });
  
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLInputElement | null>(null);
  const startDateRef = useRef<HTMLInputElement | null>(null);
  const endDateRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const assigneeRef = useRef<HTMLInputElement | null>(null);
  const projectRef = useRef<HTMLInputElement | null>(null);
  
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      const subtask = {
        id: Date.now().toString(),
        title: newSubtask.trim(),
        completed: false
      };
      setFormData(prev => ({ ...prev, subtasks: [...prev.subtasks, subtask] }));
      setNewSubtask('');
    }
  };

  const removeSubtask = (id: string) => {
    setFormData(prev => ({ ...prev, subtasks: prev.subtasks.filter(st => st.id !== id) }));
  };

  const toggleSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => 
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    if (!validation.valid) {
      setErrors(validation.errors);
      // Focus the first invalid field for accessibility
      const firstKey = Object.keys(validation.errors)[0];
      focusFirstErrorField(firstKey);
      return;
    }
    setErrors({});
    onSubmit(formData);
  };

  const focusFirstErrorField = (key: string) => {
    try {
      switch (key) {
        case 'title':
          titleRef.current?.focus();
          return;
        case 'startDate':
        case 'startTime':
          startDateRef.current?.focus();
          return;
        case 'endDate':
        case 'endTime':
          endDateRef.current?.focus();
          return;
        case 'description':
          descriptionRef.current?.focus();
          return;
        case 'assignee':
          assigneeRef.current?.focus();
          return;
        case 'project':
          projectRef.current?.focus();
          return;
        default:
          // fallback: focus the title
          titleRef.current?.focus();
      }
    } catch (err) {
      // ignore focus errors
    }
  };
  
  const updateField = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // When user toggles All-day or changes start date/time, keep end date/time reasonable:
  // default end date to start date and end time to start+1 hour when isAllDay is true.
  useEffect(() => {
    try {
      if (formData.isAllDay) {
        const s = new Date(`${formData.startDate}T${formData.startTime}`);
        if (!isNaN(s.getTime())) {
          const e = new Date(s.getTime() + 60 * 60 * 1000);
          const endDateStr = format(e, 'yyyy-MM-dd');
          const endTimeStr = format(e, 'HH:mm');
          setFormData(prev => {
            if (prev.endDate === endDateStr && prev.endTime === endTimeStr) return prev;
            return { ...prev, endDate: endDateStr, endTime: endTimeStr };
          });
        }
      }
    } catch (err) {
      // ignore date parsing errors
    }
  }, [formData.isAllDay, formData.startDate, formData.startTime]);

  const validate = (): { valid: boolean; errors: Record<string, string> } => {
    const e: Record<string, string> = {};
    const title = (formData.title || '').trim();
    if (!title) e.title = 'Title is required';
    if (title.length > 200) e.title = 'Title must be 200 characters or fewer';

    // Validate dates/times
    try {
      const start = new Date(`${formData.startDate}T${formData.startTime}`);
      const end = new Date(`${formData.endDate}T${formData.endTime}`);
      if (!formData.isAllDay && end.getTime() < start.getTime()) {
        e.endTime = 'End must be after start';
      }
    } catch (err) {
      e.startDate = 'Invalid dates or times';
    }

    if (formData.description && formData.description.length > 2000) {
      e.description = 'Description must be 2000 characters or fewer';
    }

    // PM fields length checks
    if (formData.assignee && formData.assignee.length > 200) e.assignee = 'Assignee name too long';
    if (formData.project && formData.project.length > 200) e.project = 'Project name too long';

    return { valid: Object.keys(e).length === 0, errors: e };
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={Object.keys(errors).length ? 'form-error-summary' : undefined}>
      {Object.keys(errors).length > 0 && (
        <div id="form-error-summary" role="alert" aria-live="assertive" className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-800 dark:text-red-200 p-2 rounded text-sm">
          There are {Object.keys(errors).length} errors in the form. The first error is: {errors[Object.keys(errors)[0]]}
        </div>
      )}
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          ref={titleRef}
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Event title"
          required
          data-testid="input-event-title"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'error-title' : undefined}
        />
        {errors.title && <div id="error-title" role="alert" aria-live="assertive" className="text-xs text-red-600 mt-1">{errors.title}</div>}
      </div>
      
      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => {
            const cat = categories.find(c => c.name === value);
            updateField('category', value);
            if (cat) updateField('color', cat.color);
          }}
        >
          <SelectTrigger data-testid="select-event-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.name} value={cat.name}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            ref={startDateRef}
            type="date"
            value={formData.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
            required
            data-testid="input-start-date"
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? 'error-startDate' : undefined}
          />
          {errors.startDate && <div id="error-startDate" role="alert" aria-live="assertive" className="text-xs text-red-600 mt-1">{errors.startDate}</div>}
        </div>
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => updateField('startTime', e.target.value)}
            required
            data-testid="input-start-time"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            ref={endDateRef}
            type="date"
            value={formData.endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
            required={!formData.isAllDay}
            data-testid="input-end-date"
            disabled={formData.isAllDay}
            aria-invalid={!!errors.endTime}
            aria-describedby={errors.endTime ? 'error-endTime' : undefined}
          />
          {errors.endTime && <div id="error-endTime" role="alert" aria-live="assertive" className="text-xs text-red-600 mt-1">{errors.endTime}</div>}
        </div>
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => updateField('endTime', e.target.value)}
            required={!formData.isAllDay}
            data-testid="input-end-time"
            disabled={formData.isAllDay}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isAllDay"
          checked={formData.isAllDay}
          onChange={(e) => updateField('isAllDay', e.target.checked)}
        />
        <Label htmlFor="isAllDay">All-day event</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isRecurring"
          checked={formData.isRecurring}
          onChange={(e) => updateField('isRecurring', e.target.checked)}
        />
        <Label htmlFor="isRecurring">Recurring event</Label>
      </div>
      
      {formData.isRecurring && (
        <>
          <div>
            <Label htmlFor="recurrenceFrequency">Repeat</Label>
            <Select value={formData.recurrenceFrequency} onValueChange={(value) => updateField('recurrenceFrequency', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="custom">Custom (every 2 weeks)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="recurrenceEnd">End recurrence</Label>
            <Select value={formData.recurrenceEnd} onValueChange={(value) => updateField('recurrenceEnd', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forever">Forever</SelectItem>
                <SelectItem value="1year">After 1 year</SelectItem>
                <SelectItem value="1month">After 1 month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      
      {/* Project Management Fields - Only for Tasks */}
      {formData.category === 'Task' && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-medium mb-3">Project Management</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => updateField('priority', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => updateField('status', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                ref={assigneeRef}
                value={formData.assignee}
                onChange={(e) => updateField('assignee', e.target.value)}
                placeholder="Assign to..."
              />
              {errors.assignee && <div id="error-assignee" role="alert" aria-live="assertive" className="text-xs text-red-600 mt-1">{errors.assignee}</div>}
            </div>

            <div>
              <Label htmlFor="project">Project</Label>
              <Input
                id="project"
                ref={projectRef}
                value={formData.project}
                onChange={(e) => updateField('project', e.target.value)}
                placeholder="Project name"
              />
              {errors.project && <div id="error-project" role="alert" aria-live="assertive" className="text-xs text-red-600 mt-1">{errors.project}</div>}
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) => updateField('estimatedHours', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="mb-4">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <Label>Subtasks</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
              />
              <Button type="button" onClick={addSubtask} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.subtasks.length > 0 && (
              <div className="space-y-1">
                {formData.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(subtask.id)}
                    />
                    <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                      {subtask.title}
                    </span>
                    <X
                      className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={() => removeSubtask(subtask.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Add description (optional)"
          rows={3}
          data-testid="input-event-description"
        />
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" data-testid="button-submit-event">
          {initialData ? 'Update Event' : 'Create Event'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-event">
          Cancel
        </Button>
      </div>
    </form>
  );
}
