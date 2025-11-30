import MiniCalendar from '../MiniCalendar';
import { useState } from 'react';

export default function MiniCalendarExample() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const eventDates = [
    new Date(2024, 0, 15),
    new Date(2024, 0, 18),
    new Date(2024, 0, 22),
  ];
  
  return (
    <MiniCalendar
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
      eventDates={eventDates}
    />
  );
}
