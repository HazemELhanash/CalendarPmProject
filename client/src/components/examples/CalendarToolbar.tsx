import CalendarToolbar from '../CalendarToolbar';
import { useState } from 'react';

export default function CalendarToolbarExample() {
  const [currentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  
  return (
    <CalendarToolbar
      currentDate={currentDate}
      view={view}
      onPrevious={() => console.log('Previous clicked')}
      onNext={() => console.log('Next clicked')}
      onToday={() => console.log('Today clicked')}
      onViewChange={setView}
      onQuickAdd={() => console.log('Quick add clicked')}
    />
  );
}
