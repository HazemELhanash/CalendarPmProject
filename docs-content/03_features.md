# CalendarFlow — Features

This document lists the product features and UX highlights implemented in CalendarFlow, focused on user value and typical flows.

## Core Features

- Multi-view Calendar
  - Day, Week, Month views with a MiniCalendar for navigation.
  - Recurring events, exceptions, and all-day support.

- Task & Project Management
  - Create tasks as calendar events with fields: title, description, start/end, assignee, priority, status, project, tags.
  - Project aggregation from task `project` field, with project cards and stats.

- Gantt Chart
  - Timeline for tasks with dependencies and resource load visualization.
  - Drag-and-drop reordering and interactive task bars.
  - Critical path visualization (simplified heuristic).

- Quick Add & Modals
  - QuickAdd modal for rapid task creation.
  - Dialogs for creating projects and editing events.

- Search & Filters
  - Header-level search across title, description, assignee, and project.
  - Filter popover with status, priority, assignee, and project selectors.

- Theme & Accessibility
  - Light/dark theme toggle.
  - Accessible forms and keyboard-friendly components where applicable.

## Developer/Integration Features

- Pluggable storage layer
  - `server/storage.ts` provides an `IStorage` interface to switch to a real DB later.
  - Client `eventService` abstracts storage and can use localStorage or the server API.

- API readiness
  - REST endpoints implemented for events and basic projects aggregation.
  - `client/src/lib/api/index.ts` provides a thin wrapper for these endpoints.

- Performance-minded patterns
  - Lazy-loading of heavy components (Gantt chart).
  - Controlled recurrence generation window to limit CPU usage.
  - Memoized computations where appropriate.

---

Next: `04_api_integration.md` — I'll document endpoints, integration, and React lifecycle interactions.
