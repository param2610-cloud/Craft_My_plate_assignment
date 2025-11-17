import { Booking } from '../api/types';
import { formatCurrency, formatTimeRange } from '../utils/format';

interface BookingRowProps {
  booking: Booking;
  onCancel?: (bookingId: string) => void;
  cancelling?: boolean;
}

export const BookingRow = ({ booking, onCancel, cancelling }: BookingRowProps) => {
  const canCancel = booking.status === 'CONFIRMED';

  return (
    <tr key={booking.id}>
      <td>{booking.roomName ?? booking.roomId}</td>
      <td>{booking.userName}</td>
      <td>{formatTimeRange(booking.startTime, booking.endTime)}</td>
      <td>{formatCurrency(booking.totalPrice)}</td>
      <td>{booking.status}</td>
      <td>
        <button
          type="button"
          onClick={() => onCancel?.(booking.id)}
          disabled={!canCancel || cancelling}
        >
          {cancelling && canCancel ? 'Cancelling…' : 'Cancel'}
        </button>
      </td>
    </tr>
  );
};
