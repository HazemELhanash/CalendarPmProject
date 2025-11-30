import WeekView from '../WeekView';

export default function WeekViewExample() {
  const events = [
    {
      id: '1',
      title: 'Morning Standup',
      startTime: new Date(2024, 0, 15, 9, 0),
      endTime: new Date(2024, 0, 15, 9, 30),
      category: 'Meeting',
      color: '#3b82f6'
    },
    {
      id: '2',
      title: 'Deep Work',
      startTime: new Date(2024, 0, 15, 10, 0),
      endTime: new Date(2024, 0, 15, 12, 0),
      category: 'Focus',
      color: '#8b5cf6'
    },
    {
      id: '3',
      title: 'Lunch with Client',
      startTime: new Date(2024, 0, 16, 12, 0),
      endTime: new Date(2024, 0, 16, 13, 0),
      category: 'Booking',
      color: '#10b981'
    },
  ];
  
  return (
    <div className="h-[600px] flex flex-col">
      <WeekView
        currentDate={new Date(2024, 0, 15)}
        events={events}
        onEventClick={(event) => console.log('Event clicked:', event)}
      />
    </div>
  );
}
