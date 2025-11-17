import { BookingModel } from '../models/booking.model.js';
import { RoomModel } from '../models/room.model.js';
import { AppError } from '../utils/errors.js';

interface AnalyticsFilters {
  from?: string;
  to?: string;
}

const parseDate = (value: string | undefined, field: 'from' | 'to') => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} must be a valid date`, {
      statusCode: 400,
      code: 'INVALID_ANALYTICS_DATE',
      details: { field, value }
    });
  }

  return date;
};

const formatDateForAggregation = (value?: Date) => {
  if (!value) {
    return undefined;
  }
  return value.toISOString();
};

const getSummary = async (filters: AnalyticsFilters) => {
  const fromDate = parseDate(filters.from, 'from');
  const toDate = parseDate(filters.to, 'to');

  if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
    throw new AppError('from must be earlier than to', {
      statusCode: 400,
      code: 'INVALID_ANALYTICS_RANGE'
    });
  }

  const rows = await BookingModel.aggregate(
    formatDateForAggregation(fromDate),
    formatDateForAggregation(toDate)
  );

  return Promise.all(
    rows.map(async (row) => {
      const room = await RoomModel.findById(row.roomId);
      return {
        roomId: row.roomId,
        roomName: room?.name ?? row.roomId,
        totalHours: row.totalHours,
        totalRevenue: row.totalRevenue
      };
    })
  );
};

export const analyticsService = {
  getSummary
};
