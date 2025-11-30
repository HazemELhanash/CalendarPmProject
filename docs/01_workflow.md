# CalendarFlow — Project Workflow

This document describes the overall workflow of the CalendarFlow project, how the server and client interact, and the development lifecycle from code changes to runtime behavior.

## 1. High-level architecture

- Server (Node + Express)
  - Serves API endpoints under `/api/*`.
  - In development, also runs Vite to serve the client (hot reload).
  - Provides an in-memory `MemStorage` implementation for quick dev iteration.

- Client (React + TypeScript)
  - Uses a set of UI components and pages located in `client/src`.
  - Core services live under `client/src/lib` (e.g. `eventService.ts`, `queryClient.ts`).
  - Uses `@tanstack/react-query` for data fetching patterns (via `queryClient`).

- Shared types and schemas live under `shared/schema.ts`.

## 2. Development workflow

1. Start the development server:

```powershell
cd "d:\Hazem\Recent Project\CalendarFlow"
npm install
npm run dev
```

- The server boots, registers API routes, and starts Vite (dev-only) to serve the client application.

2. Client local edits:

- Edit files under `client/src`. Vite provides HMR.
- Major features and components are split across pages (`client/src/pages`) and components (`client/src/components`).

3. Data flow while developing:

- The client currently uses `eventService` to read/write events from `localStorage` by default.
- When enabled (`USE_REMOTE_API` flag or `window.__USE_REMOTE_API`), the `eventService` will use the backend endpoints (`/api/events`) via `client/src/lib/api/index.ts`.

4. Build and production:

- In production, the server will serve the built client static files and the API will remain available at `/api`.

## 3. Runtime flow (example: loading projects page)

1. User navigates to `/#/projects`.
2. The `ProjectsPage` mounts and calls `eventService.loadEvents()`.
   - If remote API is enabled: `eventService` calls `api.fetchEvents()` which issues `GET /api/events`.
   - Otherwise `eventService` reads and deserializes events from `localStorage`.
3. Events are sanitized and recurring instances generated (limited by a configurable recurrence window).
4. UI components (filters, Gantt chart) render using the provided data.
   - The `GanttChart` component is loaded lazily (React.lazy) and only fetched when viewing the Gantt tab.

## 4. Where to change behavior

- Enable remote API usage:
  - Set environment variable `USE_REMOTE_API=true` when building the frontend, or set `window.__USE_REMOTE_API = true` in the browser devtools to flip at runtime.

- Configure recurrence generation window:
  - Set environment variable `RECURRENCE_WINDOW_DAYS` (default 365) to reduce or increase generated instances.

## 5. Tips for development

- When working on recurring logic or the Gantt chart, reduce `RECURRENCE_WINDOW_DAYS` to speed up generation and make debugging manageable.
- Use React DevTools Profiler to inspect component re-renders.
- Use the server-side storage (`server/storage.ts`) to persist data across server restarts in dev; extend `IStorage` to plug in a real DB layer later.

---

Next: `02_functionalities.md` — detailed breakdown of specific project features.
