import { Container, Typography } from '@mui/material';
import { BookingForm } from '../components/BookingForm';

interface BookingPageProps {
  onBookingCreated?: () => void;
}

export const BookingPage = ({ onBookingCreated }: BookingPageProps) => {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Booking
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Pick a room, add times, and send the request.
      </Typography>
      <BookingForm onBookingCreated={onBookingCreated} />
    </Container>
  );
};
