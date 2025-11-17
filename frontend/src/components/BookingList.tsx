import { Booking } from '../api/types';
import { BookingRow } from './BookingRow';
import { Table } from './Table';

interface BookingListProps {
  bookings: Booking[];
  onCancel?: (bookingId: string) => void;
  cancellingId?: string | null;
}

export const BookingList = ({ bookings, onCancel, cancellingId }: BookingListProps) => {
  return (
    <Table
      headers={['Room', 'Booked By', 'Time', 'Price', 'Status', 'Actions']}
      rows={bookings.map((booking) => (
        <BookingRow
          key={booking.id}
          booking={booking}
          onCancel={onCancel}
          cancelling={booking.id === cancellingId}
        />
      ))}
      emptyMessage="No bookings yet"
    />
  );
};
