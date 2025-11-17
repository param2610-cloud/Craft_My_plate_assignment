import { BookingEntity } from '../models/booking.model.js';

export interface BookingTimeRange {
  startTime: string;
  endTime: string;
}

const toTimestamp = (value: string) => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const intervalsOverlap = (
  startA: number,
  endA: number,
  startB: number,
  endB: number
) => {
  return startA < endB && startB < endA;
};

export const findConflicts = (range: BookingTimeRange, bookings: BookingEntity[]) => {
  const rangeStart = toTimestamp(range.startTime);
  const rangeEnd = toTimestamp(range.endTime);

  if (rangeStart === null || rangeEnd === null || rangeStart >= rangeEnd) {
    return [];
  }

  return bookings.filter((booking) => {
    const bookingStart = toTimestamp(booking.startTime);
    const bookingEnd = toTimestamp(booking.endTime);

    if (bookingStart === null || bookingEnd === null) {
      return false;
    }

    return intervalsOverlap(rangeStart, rangeEnd, bookingStart, bookingEnd);
  });
};

export const hasConflict = (range: BookingTimeRange, bookings: BookingEntity[]) => {
  return findConflicts(range, bookings).length > 0;
};
