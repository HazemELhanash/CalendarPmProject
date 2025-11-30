# 📅 CalendarFlow - Project Management Calendar

A modern, full-featured calendar application with integrated project management capabilities. Built with React, TypeScript, Tailwind CSS, and Drizzle ORM.

## ✨ Features

### 📋 Calendar Management
- **Multiple Views**: Month, Week, and Day views
- **Drag & Drop**: Reschedule events by dragging them to different dates
- **All-Day Events**: Support for all-day events and time-specific meetings
- **Quick Add**: Rapidly add events with a modal dialog
- **Event Details**: Comprehensive event information panel
- **Recurring Events**: Support for recurring events with customizable patterns

### 🚀 Project Management
- **Task Management**: Create, assign, and track tasks
- **Priority Levels**: Low, Medium, High, and Urgent with visual indicators
- **Status Workflows**: To Do, In Progress, Done, Blocked, Cancelled
- **Team Assignments**: Assign tasks to team members
- **Time Tracking**: Estimate and log actual hours spent
- **Subtasks**: Break complex tasks into manageable subtasks
- **Project Organization**: Group tasks by projects
- **Tags & Labels**: Flexible categorization system
- **Task Filtering**: Filter by projects, priorities, and status

### 🎨 UI/UX Features
- **Dark Mode**: Full dark mode support with theme toggle
- **Responsive Design**: Works seamlessly on all screen sizes
- **Performance Optimized**: React memoization and efficient rendering
- **Error Boundaries**: Graceful error handling
- **Smooth Animations**: Subtle transitions and interactions
- **Accessibility**: ARIA labels and keyboard navigation

### 🔄 Advanced Features
- **Recurring Instances**: Automatic generation of recurring event instances
- **Event Exceptions**: Skip or modify individual recurring instances
- **Category Filtering**: Filter events by category
- **Mini Calendar**: Quick date navigation
- **Event Search**: View all events for a specific day
- **Drag & Drop Rescheduling**: Intuitive event scheduling

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **date-fns** - Date manipulation
- **React Query** - Data fetching & caching
- **dnd-kit** - Drag and drop functionality
- **lucide-react** - Icons
- **radix-ui** - Headless UI components
- **zod** - Schema validation

### Backend
- **Node.js/Express** - Server runtime
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database (configured)
- **Vite Middleware** - Development server

### Development
- **TypeScript** - Static typing
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - Browser compatibility

##  Project Structure

```
CalendarFlow/
├── client/                          # Frontend application
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── ui/                # Shadcn/ui components
│   │   │   ├── CalendarToolbar.tsx
│   │   │   ├── MonthView.tsx
│   │   │   ├── WeekView.tsx
│   │   │   ├── DayView.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventForm.tsx
│   │   │   ├── EventDetailPanel.tsx
│   │   │   ├── TaskManagementSidebar.tsx
│   │   │   ├── ProjectFilter.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   └── calendar.tsx         # Main calendar page
│   │   ├── lib/
│   │   │   ├── eventService.ts     # Event management logic
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   └── use-toast.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
├── server/                         # Backend server
│   ├── index.ts                   # Main server file
│   ├── routes.ts                  # API routes
│   ├── storage.ts                 # Data persistence
│   └── vite.ts                    # Vite integration
├── shared/                         # Shared code
│   └── schema.ts                  # Database schema & types
├── drizzle.config.ts              # Database configuration
├── vite.config.ts                 # Vite configuration
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/CalendarFlow.git
cd CalendarFlow
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create a .env file in the root directory
# Add your database URL and other configurations
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## 📝 Usage

### Creating an Event
1. Click the "Add Event" button in the toolbar
2. Fill in the event details (title, date, time, category)
3. For tasks, add priority, status, assignee, and other PM fields
4. Submit to create the event

### Managing Tasks
1. View tasks in the Task Management sidebar
2. Tasks are organized by status (To Do, In Progress, Done, Blocked)
3. Click on a task to view full details
4. Edit priority, assignee, and other fields in the detail panel

### Filtering
- **By Category**: Toggle categories in the Category Filter
- **By Project**: Select specific projects in the Project Filter
- **By Date**: Click on dates to view specific day events

### Rescheduling Events
- Drag events to different dates in month/week view
- Drop to reschedule automatically

## 🗄️ Database Schema

### Events Table
- `id`: UUID primary key
- `title`: Event name
- `description`: Event description
- `startTime`: Start timestamp
- `endTime`: End timestamp
- `category`: Event category
- `type`: Event type (event, task, booking, deadline, availability)
- `color`: Display color
- `priority`: Task priority (low, medium, high, urgent)
- `status`: Task status (todo, in_progress, done, blocked, cancelled)
- `assignee`: Assigned team member
- `project`: Project name
- `tags`: Array of tags
- `estimatedHours`: Estimated time
- `actualHours`: Time spent
- `subtasks`: Array of subtasks
- `comments`: Array of comments
- And more PM-related fields...

## 🔧 Configuration

### Tailwind CSS
Customizable color scheme in `tailwind.config.ts`

### Database
Configure PostgreSQL connection in `drizzle.config.ts`

### Vite
Build and dev server settings in `vite.config.ts`

## 🎯 Future Enhancements

- [ ] Team collaboration features
- [ ] Real-time synchronization
- [ ] Calendar sharing
- [ ] Notifications & reminders
- [ ] Export to iCal/Google Calendar
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Custom workflows
- [ ] API documentation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Hazem**
- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

## 📞 Support

If you encounter any issues or have questions, please create an issue on GitHub.

---

Made with ❤️ using React & TypeScript
