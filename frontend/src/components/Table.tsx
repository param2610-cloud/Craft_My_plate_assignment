import { ReactElement } from 'react';

interface TableProps {
  headers: string[];
  rows: ReactElement<HTMLTableRowElement>[];
  emptyMessage?: string;
}

export const Table = ({ headers, rows, emptyMessage = 'No data available' }: TableProps) => {
  const hasRows = rows.length > 0;

  return (
    <table className="table">
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hasRows ? (
          rows
        ) : (
          <tr>
            <td colSpan={headers.length}>{emptyMessage}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
