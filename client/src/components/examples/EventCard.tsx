import EventCard from '../EventCard';

export default function EventCardExample() {
  return (
    <div className="space-y-2 p-4">
      <EventCard
        id="1"
        title="Team Meeting"
        startTime={new Date(2024, 0, 15, 10, 0)}
        endTime={new Date(2024, 0, 15, 11, 0)}
        category="Meeting"
        color="#3b82f6"
        onClick={() => console.log('Event clicked')}
      />
      <EventCard
        id="2"
        title="Project Deadline"
        startTime={new Date(2024, 0, 15, 17, 0)}
        endTime={new Date(2024, 0, 15, 17, 0)}
        category="Deadline"
        color="#ef4444"
        isCompleted={false}
        onClick={() => console.log('Deadline clicked')}
      />
      <EventCard
        id="3"
        title="Client Call"
        startTime={new Date(2024, 0, 15, 14, 0)}
        endTime={new Date(2024, 0, 15, 15, 0)}
        category="Booking"
        color="#10b981"
        isCompleted={true}
        onClick={() => console.log('Booking clicked')}
      />
    </div>
  );
}
