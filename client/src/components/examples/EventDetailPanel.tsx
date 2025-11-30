import EventDetailPanel from '../EventDetailPanel';
import { useState } from 'react';

export default function EventDetailPanelExample() {
  const [isOpen, setIsOpen] = useState(true);
  
  const sampleEvent = {
    id: '1',
    title: 'Product Launch Meeting',
    description: 'Discuss final preparations for the Q1 product launch. Review marketing materials and coordinate with stakeholders.',
    startTime: new Date(2024, 0, 15, 14, 0),
    endTime: new Date(2024, 0, 15, 15, 30),
    category: 'Meeting',
    color: '#3b82f6',
    isCompleted: false
  };
  
  return (
    <>
      {!isOpen && (
        <div className="p-4">
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Open Panel
          </button>
        </div>
      )}
      <EventDetailPanel
        event={sampleEvent}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onEdit={(event) => console.log('Edit event:', event)}
        onDelete={(id) => console.log('Delete event:', id)}
        onToggleComplete={(id) => console.log('Toggle complete:', id)}
      />
    </>
  );
}
