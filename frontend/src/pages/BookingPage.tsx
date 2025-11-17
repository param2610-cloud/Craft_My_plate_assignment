import { BookingForm } from '../components/BookingForm';
import { Section } from '../components/Section';

interface BookingPageProps {
  onBookingCreated?: () => void;
}

export const BookingPage = ({ onBookingCreated }: BookingPageProps) => {
  return (
    <Section
      title="Create Booking"
      description="Pick a room, add times, and send the request."
    >
      <BookingForm onBookingCreated={onBookingCreated} />
    </Section>
  );
};
