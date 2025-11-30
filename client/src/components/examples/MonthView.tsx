import MonthView from '../MonthView';
import { DragEndEvent } from '@dnd-kit/core';

export default function MonthViewExample() {
  const events = [
    {
      id: '1',
      title: 'Team Standup',
      startTime: new Date(2024, 0, 15, 9, 0),
      endTime: new Date(2024, 0, 15, 9, 30),
      category: 'Meeting',
      color: '#3b82f6'
    },
    {
      id: '2',
      title: 'Client Presentation',
      startTime: new Date(2024, 0, 15, 14, 0),
      endTime: new Date(2024, 0, 15, 15, 30),
      category: 'Booking',
      color: '#10b981'
    },
    {
      id: '3',
      title: 'Project Deadline',
      startTime: new Date(2024, 0, 18, 17, 0),
      endTime: new Date(2024, 0, 18, 17, 0),
      category: 'Deadline',
      color: '#ef4444'
    },
  ];
  
  return (
    <div className="h-[600px] flex flex-col">
      <MonthView
        currentDate={new Date(2024, 0, 15)}
        events={events}
        onEventClick={(event) => console.log('Event clicked:', event)}
        onDateClick={(date) => console.log('Date clicked:', date)}
        onEventReschedule={(event, newStartTime, newEndTime) => console.log('Event rescheduled:', event, newStartTime, newEndTime)}
        onShowMore={(day, events) => console.log('Show more:', day, events)}
        onDragEnd={(event) => console.log('Drag end:', event)}
      />
    </div>
  );
}
