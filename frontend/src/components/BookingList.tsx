import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import { Booking } from '../api/types';
import { BookingRow } from './BookingRow';

interface BookingListProps {
  bookings: Booking[];
  onCancel?: (bookingId: string) => void;
  cancellingId?: string | null;
  showActions?: boolean;
}

export const BookingList = ({
  bookings,
  onCancel,
  cancellingId,
  showActions = true,
}: BookingListProps) => {
  if (bookings.length === 0) {
    return <Typography>No bookings yet</Typography>;
  }

  const headers = ['Room', 'Booked By', 'Time', 'Price', 'Status'];
  if (showActions) {
    headers.push('Actions');
  }

  const headerStyles: Record<string, object> = {
    Time: { whiteSpace: 'nowrap' },
    Price: { whiteSpace: 'nowrap' },
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header} sx={headerStyles[header]}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {bookings.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              onCancel={onCancel}
              cancelling={booking.id === cancellingId}
              showActions={showActions}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
