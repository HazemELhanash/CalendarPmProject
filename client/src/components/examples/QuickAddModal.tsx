import QuickAddModal from '../QuickAddModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function QuickAddModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>
        Open Quick Add Modal
      </Button>
      <QuickAddModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(data) => console.log('Event created:', data)}
      />
    </div>
  );
}
