import EventForm from '../EventForm';

export default function EventFormExample() {
  return (
    <div className="p-4 max-w-md">
      <EventForm
        onSubmit={(data) => console.log('Form submitted:', data)}
        onCancel={() => console.log('Form cancelled')}
      />
    </div>
  );
}
