// Data service for events - abstracts storage for easy API integration
import { RRule, rrulestr } from 'rrule';
import * as api from './api';
import { addDays, subDays, isWithinInterval } from 'date-fns';

export interface Event {
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
  dependencies?: string[];
  subtasks?: {id: string, title: string, completed: boolean}[];
  attachments?: {name: string, url: string, type: string}[];
  comments?: {id: string, author: string, content: string, timestamp: string}[];
  isSkipped?: boolean;
}

class EventService {
  private storageKey = 'calendar-events';
  private _lastRawString: string | null = null;
  private _cachedGenerated: Event[] | null = null;
  private _rruleCache: Map<string, any> = new Map();
  // Default recurrence generation window (days before/after today)
  private recurrenceWindowDays = typeof process !== 'undefined' && process.env.RECURRENCE_WINDOW_DAYS ? parseInt(process.env.RECURRENCE_WINDOW_DAYS) : 365;

  // Validation limits
  private MAX_TITLE = 200;
  private MAX_DESCRIPTION = 2000;
  private MAX_TAGS = 20;
  private MAX_TAG_LENGTH = 50;
  private MAX_ATTACHMENTS = 10;
  private MAX_SUBTASKS = 50;
  // Toggle to use remote API instead of localStorage
  private useRemoteApi = typeof process !== 'undefined' && (process.env.USE_REMOTE_API === 'true' || (window as any).__USE_REMOTE_API === true);

  // Simple sanitizers and validators
  private sanitizeString(value: unknown, max = 1000): string | undefined {
    if (value === undefined || value === null) return undefined;
    const s = String(value).trim();
    if (s.length === 0) return undefined;
    return s.length > max ? s.slice(0, max) : s;
  }

  private sanitizeTags(tags: unknown): string[] | undefined {
    if (!Array.isArray(tags)) return undefined;
    const out: string[] = [];
    for (const t of tags) {
      if (out.length >= this.MAX_TAGS) break;
      const s = this.sanitizeString(t, this.MAX_TAG_LENGTH);
      if (s) out.push(s);
    }
    return out.length ? out : undefined;
  }

  private sanitizeAttachments(att: unknown): any[] | undefined {
    if (!Array.isArray(att)) return undefined;
    const out: any[] = [];
    for (const a of att) {
      if (out.length >= this.MAX_ATTACHMENTS) break;
      if (!a || typeof a !== 'object') continue;
      const name = this.sanitizeString((a as any).name, 200);
      const url = this.sanitizeString((a as any).url, 2000);
      const type = this.sanitizeString((a as any).type, 200);
      if (name && url) out.push({ name, url, type });
    }
    return out.length ? out : undefined;
  }

  private validateRecurrence(rule?: string): boolean {
    if (!rule) return true;
    try {
      // Try parsing using rrule's parseString to detect obvious errors
      (RRule as any).parseString(rule);
      return true;
    } catch (e) {
      return false;
    }
  }

  private sanitizeEventForStorage(ev: Event): any {
    // Produce a serializable, sanitized version of event for storage
    const safe: any = {
      id: String(ev.id),
      title: this.sanitizeString(ev.title, this.MAX_TITLE) || 'Untitled',
      description: this.sanitizeString(ev.description, this.MAX_DESCRIPTION),
      startTime: ev.startTime instanceof Date ? ev.startTime.toISOString() : new Date(String(ev.startTime)).toISOString(),
      endTime: ev.endTime ? (ev.endTime instanceof Date ? ev.endTime.toISOString() : new Date(String(ev.endTime)).toISOString()) : undefined,
      category: this.sanitizeString(ev.category, 100) || 'Other',
      color: this.sanitizeString(ev.color, 50) || '#000000',
      isCompleted: Boolean(ev.isCompleted),
      isRecurring: Boolean(ev.isRecurring),
      isException: Boolean(ev.isException),
      parentId: ev.parentId ? String(ev.parentId) : undefined,
      isSkipped: Boolean(ev.isSkipped),
      recurrenceRule: ev.recurrenceRule && this.validateRecurrence(ev.recurrenceRule) ? String(ev.recurrenceRule) : undefined,
      recurrenceEnd: ev.recurrenceEnd ? (ev.recurrenceEnd instanceof Date ? ev.recurrenceEnd.toISOString() : new Date(String(ev.recurrenceEnd)).toISOString()) : undefined,
      isAllDay: Boolean(ev.isAllDay),
      priority: ev.priority,
      status: ev.status,
      assignee: this.sanitizeString(ev.assignee, 200),
      project: this.sanitizeString(ev.project, 200),
      tags: this.sanitizeTags(ev.tags),
      estimatedHours: typeof ev.estimatedHours === 'number' ? ev.estimatedHours : undefined,
      actualHours: typeof ev.actualHours === 'number' ? ev.actualHours : undefined,
      dependencies: Array.isArray(ev.dependencies) ? ev.dependencies.slice(0, 50).map(String) : undefined,
      subtasks: Array.isArray(ev.subtasks) ? ev.subtasks.slice(0, this.MAX_SUBTASKS).map(st => ({ id: String(st.id), title: this.sanitizeString(st.title, 200) || '', completed: Boolean(st.completed) })) : undefined,
      attachments: this.sanitizeAttachments(ev.attachments),
      comments: Array.isArray(ev.comments) ? ev.comments.slice(0, 200).map(c => ({ id: String(c.id), author: this.sanitizeString(c.author, 200) || '', content: this.sanitizeString(c.content, 1000) || '', timestamp: String(c.timestamp) })) : undefined,
    };
    return safe;
  }

  // Load events from storage (localStorage for now, replace with API call)
  async loadEvents(): Promise<Event[]> {
    try {
      if (this.useRemoteApi) {
        const remote = await api.fetchEvents();
        const mapped = remote.map((event: any) => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: event.endTime ? new Date(event.endTime) : undefined,
          recurrenceEnd: event.recurrenceEnd ? new Date(event.recurrenceEnd) : undefined,
        }));
        const generated = this.generateRecurringInstances(mapped);
        this._lastRawString = JSON.stringify(remote);
        this._cachedGenerated = generated;
        return generated;
      }

      const rawString = localStorage.getItem(this.storageKey) || '';
      // Return cached generated instances when storage hasn't changed
      if (this._lastRawString !== null && this._lastRawString === rawString && this._cachedGenerated) {
        return this._cachedGenerated;
      }

      const raw = await this.readRawEvents();
      const generated = this.generateRecurringInstances(raw);
      this._lastRawString = rawString;
      this._cachedGenerated = generated;
      return generated;
    } catch (error) {
      console.error('Failed to load events:', error);
    }
    const fallback = this.generateRecurringInstances(this.getDefaultEvents());
    this._cachedGenerated = fallback;
    return fallback;
  }

  // Read raw stored events (no generated instances)
  private async readRawEvents(): Promise<Event[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return this.getDefaultEvents();
      const parsed = JSON.parse(stored);
      const mapped = parsed.map((event: any) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: event.endTime ? new Date(event.endTime) : undefined,
        recurrenceEnd: event.recurrenceEnd ? new Date(event.recurrenceEnd) : undefined,
      }));
      // Filter out previously-saved generated instances (they have parentId but are not exceptions)
      const cleaned = mapped.filter((e: any) => !(e.parentId && !e.isException));
      return cleaned;
    } catch (error) {
      console.error('Failed to read raw events:', error);
      return this.getDefaultEvents();
    }
  }

  // Write raw events (parents + exceptions) to storage
  private async writeRawEvents(events: Event[]): Promise<void> {
    try {
      // Sanitize and serialize events before writing
      const serialized = events.map(event => this.sanitizeEventForStorage(event));
      // Debounce rapid writes: schedule a short timeout to batch them
      if ((this as any)._writeTimeout) {
        clearTimeout((this as any)._writeTimeout);
      }
      (this as any)._writeTimeout = setTimeout(async () => {
        try {
          if (this.useRemoteApi) {
            // Push entire serialized array to remote via POST/PUT is not ideal but OK for in-memory dev API
            // We'll call create/update per item for now: clear remote and re-create is simpler for dev
            // Clear existing remote events isn't implemented on server; instead, create missing items and update existing ones
            const remote = await api.fetchEvents();
            const remoteMap = new Map(remote.map((r: any) => [r.id, r]));
            for (const s of serialized) {
              if (remoteMap.has(s.id)) {
                await api.updateEvent(s.id, s);
              } else {
                await api.createEvent(s);
              }
            }
          } else {
            localStorage.setItem(this.storageKey, JSON.stringify(serialized));
          }
          // Invalidate cache so subsequent loadEvents will regenerate
          this._lastRawString = null;
          this._cachedGenerated = null;
        } catch (err) {
          console.error('Failed to write raw events (debounced):', err);
        }
      }, 50) as any;
    } catch (error) {
      console.error('Failed to write raw events:', error);
    }
  }

  // Save events to storage (localStorage for now, replace with API call)
  // Kept for backward-compat; writes raw events
  async saveEvents(events: Event[]): Promise<void> {
    return this.writeRawEvents(events);
  }

  // Add a new event (future: API POST)
  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const newEvent = { ...event, id: String(Date.now()) } as Event;
    // Basic validation
    if (!newEvent.title || !this.sanitizeString(newEvent.title, this.MAX_TITLE)) {
      newEvent.title = 'Untitled';
    }
    if (newEvent.endTime && newEvent.startTime && newEvent.endTime.getTime() < newEvent.startTime.getTime()) {
      // Ensure endTime >= startTime
      newEvent.endTime = new Date(newEvent.startTime.getTime());
    }
    if (this.useRemoteApi) {
      const created = await api.createEvent(this.sanitizeEventForStorage(newEvent));
      // Map created fields back into Event
      return { ...newEvent, ...created, startTime: new Date(created.startTime), endTime: created.endTime ? new Date(created.endTime) : undefined } as Event;
    }

    const raw = await this.readRawEvents();
    raw.push(newEvent);
    await this.writeRawEvents(raw);
    // Ensure no stale RRule cache for this event id
    this._rruleCache.delete(newEvent.id);
    return newEvent;
  }

  // Update an event (future: API PUT)
  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    if (this.useRemoteApi) {
      const updated = await api.updateEvent(id, updates);
      return updated ? { ...updated, startTime: new Date(updated.startTime), endTime: updated.endTime ? new Date(updated.endTime) : undefined } as Event : null;
    }

    const raw = await this.readRawEvents();
    const index = raw.findIndex(e => e.id === id);
    if (index !== -1) {
      const merged = { ...raw[index], ...updates } as Event;
      // Validate merged event
      if (!merged.title || !this.sanitizeString(merged.title, this.MAX_TITLE)) merged.title = 'Untitled';
      if (merged.endTime && merged.startTime && new Date(merged.endTime).getTime() < new Date(merged.startTime).getTime()) merged.endTime = new Date(merged.startTime as any);
      raw[index] = merged;
      await this.writeRawEvents(raw);
      // Invalidate rrule cache for this event if it's a parent
      if (merged.isRecurring) this._rruleCache.delete(merged.id);
      return raw[index];
    }
    return null;
  }

  // Delete an event (future: API DELETE)
  async deleteEvent(id: string): Promise<boolean> {
    if (this.useRemoteApi) {
      try {
        await api.deleteEvent(id);
        this._rruleCache.delete(id);
        return true;
      } catch (e) {
        return false;
      }
    }

    const raw = await this.readRawEvents();
    const filtered = raw.filter(e => e.id !== id);
    if (filtered.length !== raw.length) {
      await this.writeRawEvents(filtered);
      // Remove cached rule if any
      this._rruleCache.delete(id);
      return true;
    }
    return false;
  }

  // Create a recurring event
  async createRecurringEvent(event: Omit<Event, 'id'>, recurrenceRule: string, recurrenceEnd?: Date): Promise<Event> {
    // Validate recurrence
    if (!this.validateRecurrence(recurrenceRule)) {
      throw new Error('Invalid recurrence rule');
    }
    const newEvent = { ...event, id: String(Date.now()), recurrenceRule, recurrenceEnd, isRecurring: true } as Event;
    const raw = await this.readRawEvents();
    raw.push(newEvent);
    await this.writeRawEvents(raw);
    // Cache invalidation
    this._rruleCache.delete(newEvent.id);
    return newEvent;
  }

  // Update recurring series
  async updateRecurringSeries(parentId: string, updates: Partial<Event>): Promise<Event | null> {
    const raw = await this.readRawEvents();
    const parentIndex = raw.findIndex(e => e.id === parentId && e.isRecurring);
    if (parentIndex !== -1) {
      raw[parentIndex] = { ...raw[parentIndex], ...updates };
      await this.writeRawEvents(raw);
      // Invalidate cache for updated parent
      this._rruleCache.delete(parentId);
      return raw[parentIndex];
    }
    return null;
  }

  // Create exception for a recurring instance
  async createException(instanceData: Omit<Event, 'id'>): Promise<Event> {
    const raw = await this.readRawEvents();
    const instanceStart = instanceData.startTime instanceof Date ? instanceData.startTime.getTime() : new Date(instanceData.startTime as any).getTime();
    const parentId = instanceData.parentId || (instanceData as any).id;

    // If an exception already exists for this parent + startTime, return it instead of creating a duplicate
    const existing = raw.find(e => e.isException && e.parentId === parentId && e.startTime.getTime() === instanceStart);
    if (existing) {
      try {
        console.debug('createException: existing exception found for parent', parentId, 'start', new Date(instanceStart).toISOString());
      } catch (e) {}
      return existing;
    }

    const newException: Event = { ...instanceData, id: String(Date.now()), parentId, isException: true } as Event;
    // Ensure sanitized fields on exceptions
    if (!newException.title || !this.sanitizeString(newException.title, this.MAX_TITLE)) newException.title = 'Untitled';
    raw.push(newException);
    await this.writeRawEvents(raw);
    // Invalidate cache for parent to reflect new exception
    if (newException.parentId) this._rruleCache.delete(newException.parentId);
    try {
      console.debug('createException: created exception', { id: newException.id, parentId: newException.parentId, start: newException.startTime instanceof Date ? newException.startTime.toISOString() : String(newException.startTime) });
    } catch (e) {}
    return newException;
  }

  // Stop recurring series
  async stopRecurringSeries(parentId: string): Promise<boolean> {
    return await this.updateRecurringSeries(parentId, { recurrenceEnd: new Date() }) !== null;
  }

  // Stop instance temporarily (mark as skipped)
  async stopInstanceTemporarily(instanceId: string): Promise<boolean> {
    return await this.updateEvent(instanceId, { isCompleted: true }) !== null;
  }

  // Remove instance (delete exception or skip)
  async removeInstance(instanceId: string): Promise<boolean> {
    return await this.deleteEvent(instanceId);
  }

  // Get recurring parents
  async getRecurringParents(): Promise<Event[]> {
    const raw = await this.readRawEvents();
    return raw.filter(e => e.isRecurring);
  }

  // Get upcoming instances for a parent (includes existing exceptions as real items)
  async getUpcomingInstancesForParent(parentId: string, count = 5): Promise<Event[]> {
    const raw = await this.readRawEvents();
    const parent = raw.find(e => e.id === parentId && e.isRecurring);
    if (!parent || !parent.recurrenceRule) return [];

    try {
      const options = (RRule as any).parseString(parent.recurrenceRule || '');
      options.dtstart = parent.startTime instanceof Date ? parent.startTime : new Date(parent.startTime as any);
      const untilDate = parent.recurrenceEnd || addDays(new Date(), 730);
      options.until = untilDate;
      const rule = new RRule(options);

      const now = new Date();
      const instances = rule.between(now, untilDate, true);
      const results: Event[] = [];

      for (const instanceDate of instances) {
        // Check if an exception exists for this occurrence
        const existingException = raw.find(e => e.parentId === parent.id && e.isException && e.startTime.getTime() === instanceDate.getTime());
        if (existingException) {
          results.push(existingException);
        } else {
          const duration = parent.endTime ? parent.endTime.getTime() - parent.startTime.getTime() : 0;
          const instance: Event = {
            ...parent,
            id: `${parent.id}-${instanceDate.getTime()}`,
            startTime: instanceDate,
            endTime: parent.endTime ? new Date(instanceDate.getTime() + duration) : undefined,
            parentId: parent.id,
            isRecurring: false,
            isException: false,
          };
          results.push(instance);
        }
        if (results.length >= count) break;
      }

      return results;
    } catch (error) {
      console.error('Failed to compute upcoming instances for parent:', parentId, error);
      return [];
    }
  }

  // Generate recurring instances for display
  private generateRecurringInstances(events: Event[]): Event[] {
    // Use a map to deduplicate by id (prevents accidental duplicate instances)
    const eventMap = new Map<string, Event>();
    // Start with raw events except parent (recurring) definitions — we display instances instead
    for (const e of events) {
      if (e.isRecurring || e.isSkipped) continue;
      eventMap.set(e.id, e);
    }
    const recurringParents = events.filter(e => e.isRecurring && e.recurrenceRule);

    for (const parent of recurringParents) {
      if (!parent.recurrenceRule) continue;
      try {
        // Use cached RRule object per parent when possible
        let rule = this._rruleCache.get(parent.id);
        if (!rule) {
          const options = (RRule as any).parseString(parent.recurrenceRule || '');
          options.dtstart = parent.startTime instanceof Date ? parent.startTime : new Date(parent.startTime as any);
          const untilDate = parent.recurrenceEnd || addDays(new Date(), 730);
          options.until = untilDate;
          rule = new RRule(options);
          this._rruleCache.set(parent.id, rule);
        }

        // Limit generation window to avoid creating massive instance lists
        const startDate = subDays(new Date(), Math.floor(this.recurrenceWindowDays / 2));
        const untilDate = parent.recurrenceEnd || addDays(new Date(), Math.ceil(this.recurrenceWindowDays / 2));
        const instances = rule.between(startDate, untilDate, true);

        // Precompute parent start and duration once
        const parentStartMs = parent.startTime instanceof Date ? parent.startTime.getTime() : new Date(parent.startTime as any).getTime();
        const duration = parent.endTime ? (parent.endTime instanceof Date ? parent.endTime.getTime() : new Date(parent.endTime as any).getTime()) - parentStartMs : 0;

        for (const instanceDate of instances) {
          const instanceMs = instanceDate.getTime();
          // Skip if already an exception
          const existingException = events.find(e => e.parentId === parent.id && e.startTime.getTime() === instanceMs);
          if (existingException) continue;

          // Skip generating an instance that matches the parent's own startTime
          if (parentStartMs && instanceMs === parentStartMs) continue;

          const instanceId = `${parent.id}-${instanceMs}`;
          if (eventMap.has(instanceId)) continue;
          const instance: Event = {
            ...parent,
            id: instanceId,
            startTime: new Date(instanceMs),
            endTime: parent.endTime ? new Date(instanceMs + duration) : undefined,
            parentId: parent.id,
            isRecurring: false,
            isException: false,
          };
          eventMap.set(instanceId, instance);

          // Limit to 500 instances per parent for performance
          if (eventMap.size >= 500) break;
        }
      } catch (error) {
        console.error('Failed to generate recurring instances for event:', parent.id, error);
      }
    }

    return Array.from(eventMap.values());
  }

  // Get default events for first-time users
  private getDefaultEvents(): Event[] {
    return [
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
  }
}

export const eventService = new EventService();