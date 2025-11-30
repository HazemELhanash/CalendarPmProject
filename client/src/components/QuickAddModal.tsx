import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EventForm from "./EventForm";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialDate?: Date;
  initialData?: any;
}

export default function QuickAddModal({ isOpen, onClose, onSubmit, initialDate, initialData }: QuickAddModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden fade-in" data-testid="dialog-quick-add">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
          <EventForm
            initialData={initialData}
            onSubmit={(data) => {
              onSubmit(data);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
