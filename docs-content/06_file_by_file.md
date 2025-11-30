# CalendarFlow — Serialized File-by-File Walkthrough

This document walks through the repository file-by-file in a logical order (entry points → server → client → lib → components), describing what each file does and how it relates to others.

> Notes: Files are described in a sequence that mirrors the runtime flow: server boot → routes/storage → client entry → pages → components → libs.

---

## 1. Root-level files

- `package.json`
  - Project manifest — scripts, dependencies. Use `npm run dev` to start the project in development.

- `vite.config.ts`
  - Vite configuration used for the frontend; in development the server integrates with Vite for hot module replacement.

- `drizzle.config.ts` and `shared/schema.ts`
  - `shared/schema.ts` contains database table definitions and Zod schemas for events using Drizzle and `drizzle-zod`. These types are shared between server and client to keep contract consistent.

- `README.md`, `CONTRIBUTING.md`, `GITHUB_SETUP.md`
  - Documentation and onboarding artifacts.

---

## 2. Server

Path: `server/`

- `server/index.ts`
  - Application entry for the Node/Express server.
  - Sets up security headers, request/response logging, JSON body parsing, and registers routes by calling `registerRoutes` from `routes.ts`.
  - Starts Vite in development for serving the frontend.

- `server/routes.ts`
  - Defines REST endpoints under `/api`. Key endpoints:
    - `GET /api/health` — basic health check.
    - `GET/POST/PUT/DELETE /api/events` — event CRUD.
    - `GET /api/projects` — server-side aggregation of tasks into project objects.
  - Uses `server/storage.ts`'s `storage` instance for persistence. This is intentionally pluggable.

- `server/storage.ts`
  - The in-memory `MemStorage` implements an `IStorage` interface. Provides:
    - User CRUD (as originally scaffolded).
    - Event CRUD: `listEvents`, `getEvent`, `createEvent`, `updateEvent`, `deleteEvent`.
  - Designed to be replaced by a DB-backed implementation later (Postgres, SQLite).

---

## 3. Shared schema

- `shared/schema.ts`
  - Drizzle table definitions for `events` with project-management fields (priority, status, assignee, tags, dependencies, etc.).
  - Exports Zod insert schema `insertEventSchema` and TypeScript types used across server and client.

---

## 4. Client entry

Path: `client/src/`

- `client/src/main.tsx` and `client/src/index.css`
  - Bootstraps the React app, applies global styles and providers.

- `client/index.html`
  - Top-level HTML file for Vite.

---

## 5. Client libraries and services

- `client/src/lib/eventService.ts`
  - Central event data service. Responsibilities:
    - Read/write events to `localStorage` by default (debounced writes).
    - Create/update/delete operations for events and recurring series.
    - Sanitize user input and produce a serializable form for storage.
    - Generate recurring instances using `rrule` within a configurable window (controlled via `RECURRENCE_WINDOW_DAYS`).
    - Optional remote API usage via `client/src/lib/api/index.ts` when `USE_REMOTE_API` is enabled.
  - This file is the single source of truth for event logic and recurrence handling.

- `client/src/lib/queryClient.ts`
  - Sets up `@tanstack/react-query` client and defines `apiRequest` helper.
  - Provides `getQueryFn` which allows `react-query` to fetch via a canonical strategy (including 401 handling).

- `client/src/lib/api/index.ts`
  - Thin wrapper around server endpoints using `apiRequest`.
  - Exposes `fetchEvents`, `createEvent`, `updateEvent`, `deleteEvent`, `fetchProjects`.

- `client/src/lib/utils.ts`
  - Misc helpers used throughout the UI.

---

## 6. Pages

- `client/src/pages/calendar.tsx`
  - The calendar page wiring various views (day/week/month) and fetching events.

- `client/src/pages/projects.tsx`
  - Project management UI. Key responsibilities:
    - Load events via `eventService.loadEvents()`.
    - Maintain filter/search state, project/task aggregation, and tabs for different views (board, Gantt, lists).
    - Lazy-load `GanttChart` for better initial performance.
    - Create new projects via a dialog that writes via `eventService` (calls `saveEvents`/`createEvent`).

- `client/src/pages/kanban.tsx`, `projects.tsx`, `not-found.tsx`
  - Additional pages for project boards and fallback routes.

---

## 7. Components (selected)

- `client/src/components/GanttChart.tsx`
  - Renders a timeline of tasks, handles drag-and-drop reordering, computes dependency levels and resource load.
  - Optimized to reduce O(n^2) behaviour and deterministic resource load.

- `client/src/components/EventForm.tsx`
  - Form for creating or editing events, used by modals and quick-add flows.

- `client/src/components/EventDetailPanel.tsx`
  - Side-panel to view and act on event details.

- `client/src/components/ProjectCard.tsx`, `TaskCard.tsx`
  - UI cards for listing projects and tasks; used across projects page and boards.

- `client/src/components/ui/*`
  - Design system components (Button, Dialog, Popover, Select, Input, Textarea, etc.). These are used widely and provide consistent styling and behavior.

---

## 8. Examples & UI patterns

- `client/src/components/examples/` contains example usages of components for quick local development and reference.

---

## 9. Build / Run notes

- Development:
  - `npm run dev` starts the server and Vite; use the logs to inspect API calls.
- Production:
  - Build the client and serve static files via the server. Replace `MemStorage` with a production storage implementation.

---

## 10. Where pieces interact (runtime sequence)

1. Server boots (`server/index.ts`) and registers routes.
2. Client loads (`main.tsx`) and mounts React app.
3. Pages call `eventService` to load events (from localStorage or remote API).
4. Components render sanitized events and use recurring instance generation for display.
5. UI interactions call `eventService` to persist changes; when `USE_REMOTE_API` enabled, those calls go to the server.

---

## 11. How to extend or replace parts

- To add persistent storage:
  1. Implement `IStorage` backed by a DB in `server/storage.ts` or a new module.
  2. Migrate or map `shared/schema.ts` to migrations and apply.
  3. Add server-side validation using Zod and `insertEventSchema`.

- To improve client rendering:
  - Virtualize long lists.
  - Move heavy computations to web workers.
  - Use `react-query` for caching and optimistic updates.

---

This concludes the serialized walkthrough. After review, I can add cross-references and inline code pointers in each file's description or generate a diagram describing interactions.
