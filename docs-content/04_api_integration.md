# CalendarFlow — API Readiness & Integration

This document explains the server API surface, the client API wrapper, and how React components and `eventService` integrate with the API and component lifecycle.

## 1. Server API Endpoints (dev-ready)

Implemented endpoints in `server/routes.ts` (all prefixed with `/api`):

- `GET /api/health` — simple health check returning `{ status: 'ok' }`.

- `GET /api/events` — list all events. Returns an array of event objects (serialized fields: `startTime`, `endTime`, etc.).

- `GET /api/events/:id` — fetch a single event by id.

- `POST /api/events` — create an event. Accepts event JSON in request body and returns the created event.

- `PUT /api/events/:id` — update an event. Accepts partial fields and returns the updated event.

- `DELETE /api/events/:id` — delete an event. Returns 204 if successful.

- `GET /api/projects` — server-side aggregation of tasks into projects (simple grouping by `project` field).

These endpoints currently use `server/storage.ts`'s `MemStorage` as an in-memory store for development. The `IStorage` interface is designed to be replaced with a database-backed implementation later.

## 2. Client API Wrapper

- `client/src/lib/api/index.ts` exposes the following helpers:
  - `fetchEvents()` — GET `/api/events`
  - `fetchEvent(id)` — GET `/api/events/:id`
  - `createEvent(event)` — POST `/api/events`
  - `updateEvent(id, patch)` — PUT `/api/events/:id`
  - `deleteEvent(id)` — DELETE `/api/events/:id`
  - `fetchProjects()` — GET `/api/projects`

- These functions use `client/src/lib/queryClient.ts`'s `apiRequest` helper for consistent `fetch` options and error handling.

## 3. Integration with `eventService`

- `client/src/lib/eventService.ts` is the canonical place the UI calls for CRUD operations.

- The service has a runtime toggle:
  - If `USE_REMOTE_API=true` (or `window.__USE_REMOTE_API === true`), `eventService` delegates to the API wrapper for `loadEvents`, `createEvent`, `updateEvent`, and `deleteEvent`.
  - Otherwise it uses `localStorage` for fast local dev iteration.

- `eventService` still performs sanitization and recurrence generation client-side (this preserves behavior whether storage is local or remote).

## 4. React Component Lifecycle and Data Flow

- Typical data flow:
  1. Component mounts (e.g., `ProjectsPage`).
  2. Component calls `eventService.loadEvents()` inside `useEffect` or via a `react-query` hook. This returns sanitized events and generated recurring instances.
  3. Component sets local state with events (or the query cache is populated if using `react-query`).
  4. UI renders based on the state.
  5. For create/update/delete actions, components call `eventService.createEvent/updateEvent/deleteEvent` which persist changes and then either return new state or components re-run `loadEvents`/refetch to refresh UI.

- Notes on lifecycle considerations:
  - `eventService.loadEvents()` can be expensive when recurrence generation runs across large windows; use `RECURRENCE_WINDOW_DAYS` to limit generation during render-sensitive operations.
  - Heavy visualizations like the `GanttChart` are lazy-loaded to avoid blocking initial render. When the Gantt tab is activated, React Suspense triggers the chunk download, then the component mounts and uses already-provided `tasks`.
  - When using remote API, network latency can increase perceived UI latency. Consider optimistic updates and `react-query` for caching/refetch strategies.

## 5. Readiness & Next Steps for Real API

- The current server is development-ready but minimal. To make it production-ready:
  - Replace `MemStorage` with a persistent database implementation (Postgres, SQLite, or other) that implements `IStorage`.
  - Add validation and sanitization on the server using `shared/schema.ts` types (Zod or runtime validation).
  - Add authentication and user-scoped data access.
  - Add pagination and server-side filtering for `/api/events` to avoid returning huge datasets.
  - Add tests for endpoints and storage layer.

## 6. Quick Dev Tips

- Switch to remote API in-browser by running `window.__USE_REMOTE_API = true` in devtools and reloading.
- Use the `apiRequest` wrapper when adding new API clients to preserve consistent headers and credentials.

---

Next: `05_optimizations.md` — I'll detail the optimizations already applied and further recommendations.
