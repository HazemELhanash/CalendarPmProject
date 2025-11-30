# Calendar Project Management App - Design Guidelines

## Design Approach
**System**: Custom design inspired by Linear's modern productivity aesthetic combined with Google Calendar's interaction patterns. Focus on clarity, efficiency, and dense information display without overwhelming the user.

## Core Design Principles
1. **Information Density with Clarity**: Maximize useful data display while maintaining scannable hierarchy
2. **Action-Oriented**: Primary actions always visible and accessible
3. **Status-Driven Design**: Visual indicators for event types, availability, and deadlines
4. **Fluid Interactions**: Smooth drag-drop, quick-add, and instant feedback

## Typography
**Font Stack**: Inter (via Google Fonts CDN)
- **Headings**: 600 weight, sizes 24px (page titles), 18px (section headers), 16px (card headers)
- **Body**: 400 weight, 14px for primary content, 13px for secondary
- **Small/Meta**: 500 weight, 12px for labels, timestamps, category tags
- **Monospace**: For time displays (10:00 AM format)

## Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8 for consistent rhythm (p-2, m-4, gap-6, space-y-8)

**Application Structure**:
- **Sidebar**: Fixed 280px width, left-aligned, contains mini calendar, view switcher, filters, and category list
- **Main Calendar Area**: Flex-grow content area with toolbar above calendar grid
- **Event Detail Panel**: 400px slide-out from right when event selected

**Calendar Grid**:
- Month view: 7-column grid with equal cell heights
- Week view: Time slots (30-min increments) with hour markers on left
- Day view: Detailed hourly breakdown with multi-column for overlapping events

## Component Library

### Navigation & Controls
- **Top Toolbar**: Date navigation (prev/today/next), view switcher (month/week/day), search, quick-add button
- **Sidebar Mini Calendar**: Condensed month view for quick date jumping, current date highlighted
- **View Tabs**: Pill-style active state for month/week/day selection

### Calendar Components
- **Event Cards**: Rounded corners (4px), left border (4px) for category color, title + time stacked, truncate with ellipsis
- **Time Slots**: Grid cells with hover state, ghost indicator when dragging
- **Availability Blocks**: Diagonal stripe pattern for busy, solid for available, dotted border for tentative
- **Deadline Indicators**: Red dot badge on dates, warning triangle for overdue

### Forms & Modals
- **Quick Add Modal**: Centered 480px width, fields for title, date/time pickers, duration, category dropdown, description textarea
- **Event Detail Panel**: Slide-in from right, full event info with edit/delete actions at top
- **Availability Manager**: Time range picker with preset blocks (9-5, after hours, weekends)

### Data Display
- **Event List View**: Alternative to calendar grid, sorted by date, group headers for each day
- **Category Pills**: Small rounded badges with category color dot + label
- **Conflict Warnings**: Yellow banner when time slots overlap

### Interactive Elements
- **Drag Handles**: Subtle grip icon on hover for draggable events
- **Time Pickers**: Dropdown menus with 15/30-minute increments
- **Filter Chips**: Removable tags for active filters with X button

## Interaction Patterns
- **Event Creation**: Click empty slot → quick add modal OR drag to block time → details form
- **Event Editing**: Click event card → detail panel slides in → edit button → inline editing
- **Rescheduling**: Drag event to new slot, real-time validation, snap to time grid
- **Multi-select**: Shift+click for bulk operations (delete, change category)

## Animations
**Minimal, purposeful animations only**:
- Calendar navigation: 200ms slide transition between months
- Panel transitions: 250ms ease-in-out for detail panel
- Event drag: Smooth follow with ghost preview
- No decorative animations - focus on responsive feedback

## Icons
**Library**: Heroicons (via CDN)
- Navigation: ChevronLeft, ChevronRight, Calendar, Clock
- Actions: Plus, Pencil, Trash, Check, X
- Filters: Funnel, AdjustmentsHorizontal
- Status: ExclamationTriangle (overdue), CheckCircle (completed)

## Accessibility
- Keyboard navigation: Tab through events, Enter to open, Arrow keys to navigate dates
- ARIA labels on all interactive calendar cells
- Focus indicators: 2px outline on keyboard focus
- Screen reader announcements for date changes and event updates

## Images
**No hero image** - This is a productivity tool, not a marketing site. Launch directly into the calendar interface.

**Icon Usage Only**: Use icon library for all visual indicators. No photographic images needed for this application type.