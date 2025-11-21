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
import { formatCurrency } from '../utils/format';

interface AnalyticsTableProps {
  rows: Array<{
    roomId: string;
    roomName: string;
    totalHours: number;
    totalRevenue: number;
  }>;
}

export const AnalyticsTable = ({ rows }: AnalyticsTableProps) => {
  if (rows.length === 0) {
    return <Typography>No analytics available</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Room</TableCell>
            <TableCell>Hours</TableCell>
            <TableCell>Revenue</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.roomId}>
              <TableCell>{row.roomName}</TableCell>
              <TableCell>{row.totalHours.toFixed(2)}</TableCell>
              <TableCell>{formatCurrency(row.totalRevenue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
