import { TableCell, TableRow, Button, CircularProgress } from '@mui/material';
import { Booking } from '../api/types';
import { formatCurrency, formatTimeRange } from '../utils/format';

interface BookingRowProps {
  booking: Booking;
  onCancel?: (bookingId: string) => void;
  cancelling?: boolean;
  showActions?: boolean;
}

export const BookingRow = ({
  booking,
  onCancel,
  cancelling,
  showActions = true,
}: BookingRowProps) => {
  const canCancel = booking.status === 'CONFIRMED' && Boolean(onCancel);

  return (
    <TableRow hover>
      <TableCell>{booking.roomName ?? 'Unknown room'}</TableCell>
      <TableCell>{booking.userName}</TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {formatTimeRange(booking.startTime, booking.endTime)}
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatCurrency(booking.totalPrice)}</TableCell>
      <TableCell>{booking.status}</TableCell>
      {showActions && (
        <TableCell>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => onCancel?.(booking.id)}
            disabled={!canCancel || cancelling}
            size="small"
          >
            {cancelling && canCancel ? (
              <CircularProgress size={20} />
            ) : (
              'Cancel'
            )}
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
};
