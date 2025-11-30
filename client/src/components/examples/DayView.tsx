import DayView from '../DayView';

export default function DayViewExample() {
  const events = [
    {
      id: '1',
      title: 'Morning Standup',
      description: 'Daily team sync meeting',
      startTime: new Date(2024, 0, 15, 9, 0),
      endTime: new Date(2024, 0, 15, 9, 30),
      category: 'Meeting',
      color: '#3b82f6'
    },
    {
      id: '2',
      title: 'Deep Work Session',
      description: 'Focus time for development',
      startTime: new Date(2024, 0, 15, 10, 0),
      endTime: new Date(2024, 0, 15, 12, 0),
      category: 'Focus Time',
      color: '#8b5cf6'
    },
    {
      id: '3',
      title: 'Lunch Meeting',
      startTime: new Date(2024, 0, 15, 12, 30),
      endTime: new Date(2024, 0, 15, 13, 30),
      category: 'Booking',
      color: '#10b981'
    },
    {
      id: '4',
      title: 'Code Review',
      startTime: new Date(2024, 0, 15, 15, 0),
      endTime: new Date(2024, 0, 15, 16, 0),
      category: 'Meeting',
      color: '#3b82f6'
    },
  ];
  
  return (
    <div className="h-[600px] flex flex-col">
      <DayView
        currentDate={new Date(2024, 0, 15)}
        events={events}
        onEventClick={(event) => console.log('Event clicked:', event)}
      />
    </div>
  );
}
