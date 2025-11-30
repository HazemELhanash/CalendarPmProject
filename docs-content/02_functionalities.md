# CalendarFlow — Functionalities

This document describes the specific functionalities implemented across the project. It focuses on user-facing features and their implementation locations in the codebase.

## 1. Calendar and Views

- Files:
  - `client/src/components/MiniCalendar.tsx` — small month picker and quick navigation.
  - `client/src/components/DayView.tsx`, `WeekView.tsx`, `MonthView.tsx` — each view renders events appropriate for that time window.
  - `client/src/pages/calendar.tsx` — page glue wiring UI and data fetching.

- Key behavior:
  - Renders events loaded from `eventService`.
  - Supports recurring events by using generated instances from `eventService.generateRecurringInstances`.
  - Event click opens `EventDetailPanel`.

## 2. Event Management

- Files:
  - `client/src/lib/eventService.ts` — canonical place for all event CRUD, recurring logic, sanitization, storage abstraction.
  - `client/src/components/EventForm.tsx` — form for creating/updating events.
  - `client/src/components/EventDetailPanel.tsx` — details and quick actions for an event.

- Key behavior:
  - Create/update/delete events via `eventService` which persists to `localStorage` or the remote `/api/events` when enabled.
  - Recurrence rules validated using `rrule` library.
  - Exception handling for recurring instances supported.

## 3. Projects & Tasks

- Files:
  - `client/src/pages/projects.tsx` — full project management UI, header controls (search, filters), tabs (boards, gantt), and stats.
  - `client/src/components/ProjectCard.tsx`, `TaskCard.tsx` — cards for listing projects and tasks.
  - `client/src/components/QuickAddModal.tsx` — quick creation of tasks.

- Key behavior:
  - Tasks are events with `category === 'Task'`.
  - Projects are collected from tasks' `project` field; `GET /api/projects` aggregates tasks into projects.
  - Filtering and search operate on sanitized fields (title, description, assignee, project).

## 4. Gantt Chart

- Files:
  - `client/src/components/GanttChart.tsx`

- Key behavior:
  - Produces a timeline view for tasks (tasks with `category === 'Task'`).
  - Supports drag-and-drop using `@dnd-kit` for reordering and date changes (currently logs updates; event updates handled through `eventService.updateEvent`).
  - Visualizes dependencies, resource loads, and milestones.
  - Lazily loaded in the projects page to reduce initial bundle size.

## 5. UI Components & Patterns

- Files:
  - `client/src/components/ui/*` — shadcn-style UI primitives (Button, Dialog, Popover, Select, etc.).
  - `client/src/components/NavBar.tsx`, `ThemeToggle.tsx` — app-level navigation and theme handling.

- Key behavior:
  - Shared UI components provide a consistent look-and-feel.
  - Dialog/Popover components used for forms and filters.

## 6. Data Layer & Networking

- Files:
  - `client/src/lib/queryClient.ts` — `@tanstack/react-query` integration and `apiRequest` helper.
  - `client/src/lib/api/index.ts` — thin wrapper over the server REST API.
  - `server/routes.ts` & `server/storage.ts` — in-memory API server endpoints (dev) and storage.

- Key behavior:
  - `eventService` is the single point of truth for CRUD operations; it delegates to localStorage or the API wrapper depending on runtime config.
  - `queryClient` provides a default `queryFn` for `react-query` hooks (used elsewhere as needed).

## 7. Utilities

- Files:
  - `client/src/lib/utils.ts` — small helpers used across the app.

---

Next: `03_features.md` — condensed feature list and UX highlights.
