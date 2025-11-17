import { Table } from './Table';
import { formatCurrency } from '../utils/format';

interface AnalyticsTableProps {
  rows: Array<{ roomId: string; roomName: string; totalHours: number; totalRevenue: number }>;
}

export const AnalyticsTable = ({ rows }: AnalyticsTableProps) => {
  return (
    <Table
      headers={['Room', 'Hours', 'Revenue']}
      rows={rows.map((row) => (
        <tr key={row.roomId}>
          <td>{row.roomName}</td>
          <td>{row.totalHours.toFixed(2)}</td>
          <td>{formatCurrency(row.totalRevenue)}</td>
        </tr>
      ))}
      emptyMessage="No analytics available"
    />
  );
};
