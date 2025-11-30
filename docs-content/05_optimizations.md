# CalendarFlow — Optimizations & Performance Notes

This document explains the optimizations applied so far and provides recommendations for further improvements. Each item includes where changes were made and why.

## 1. Recurrence Generation Window (Applied)

- Location: `client/src/lib/eventService.ts`
- Change: Introduced `recurrenceWindowDays` (default 365) and limited per-parent generation to a symmetric window around the current date.
- Why: Reduces CPU and memory usage when events have long-running or frequent recurrence rules that would otherwise generate thousands of instances.
- How to tune: Set environment variable `RECURRENCE_WINDOW_DAYS` to a smaller value (e.g., 180 or 90) during development or for low-memory environments.

## 2. Gantt Chart Optimizations (Applied)

- Location: `client/src/components/GanttChart.tsx`
- Changes:
  - Replaced repeated O(n^2) dependency level calculations with a queued propagation approach.
  - Deterministic `resourceLoad` calculation based on `estimatedHours` or duration instead of random values.
  - Minor math guards in `getTaskPosition` to avoid division by zero and ensure minimum widths.
- Why: Reduces unnecessary CPU work on every render and ensures consistent results across re-renders.

## 3. Lazy Loading Heavy Components (Applied)

- Location: `client/src/pages/projects.tsx`
- Change: `GanttChart` now loaded via `React.lazy` + `Suspense`.
- Why: Avoids loading the Gantt chart bundle and running its expensive render logic until the user navigates to the Gantt tab.

## 4. Memoization & Stable Props (Applied/Partial)

- Observations:
  - Many components already use `useMemo` for derived lists (tasks filtered, projects map), but ensure that props passed to heavy components are stable references (useMemo/useCallback) where necessary.
- Recommendation:
  - Audit prop shapes and wrap handlers with `useCallback` when passed to memoized or heavy components.

## 5. Server-side Improvements (Recommendations)

- Pagination and Filtering
  - Implement server-side pagination for `GET /api/events` with query parameters (`?page=1&pageSize=100`) and server-side filtering to avoid transferring large payloads.

- Move heavy filtering to server
  - Currently client filters the full events list. Push filter logic into the server API and expose filter parameters. This reduces bandwidth and client CPU.

- Persist recurrence computation server-side (optional)
  - For very large data sets, compute recurring instances on the server in a precomputed window or generate them on-demand via streaming.

## 6. Further Client Optimizations (Recommendations)

- Virtualize long lists (e.g., `react-window` or `react-virtualized`) in lists (Project list, Task board, etc.) to ensure rendering cost scales with visible items.

- Web Workers for Recurrence
  - Offload recurrence generation to a Web Worker to prevent blocking the main thread and UI responsiveness.

- Debounce writes (already present)
  - `eventService` already debounces writes; consider increasing the debounce when using remote APIs to batch more updates.

- Use `react-query` for cache + optimistic updates
  - Integrate more `react-query` usage for mutation caching and retry strategies to improve perceived latency with remote API.

## 7. Profiling & Monitoring

- Use browser profiler and React DevTools Profiler to capture flame graphs and re-render heatmaps.
- Add logging and timing for heavy operations (recurrence generation, Gantt layout) — this helps prioritize further optimization.

---

Next: `06_file_by_file.md` — a serialized, file-by-file walkthrough describing each file in order.
