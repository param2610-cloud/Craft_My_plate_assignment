import { BookingModel, BookingFilters, BookingStatus } from '../models/booking.model.js';
import type { BookingEntity } from '../models/booking.model.js';
import { RoomModel } from '../models/room.model.js';
import { AppError } from '../utils/errors.js';
import { calculateDynamicPrice } from '../utils/pricing.util.js';
import { AsyncLock } from '../utils/lock.util.js';

export interface CreateBookingInput {
  roomId: string;
  userName: string;
  startTime: string;
  endTime: string;
}

export interface CancelBookingInput {
  bookingId: string;
  cancelledBy?: string;
}

const MAX_DURATION_MS = 12 * 60 * 60 * 1000;
const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;

class BookingService {
  private creationLock = new AsyncLock();

  async listBookings(filters: BookingFilters = {}) {
    const validated = this.validateFilters(filters);
    const bookings = await BookingModel.findAll(validated);

    return Promise.all(bookings.map((booking) => this.withRoomName(booking)));
  }

  async createBooking(payload: CreateBookingInput) {
    return this.creationLock.runExclusive(async () => {
      const userName = payload.userName?.trim();
      if (!userName) {
        throw new AppError('userName is required', { statusCode: 400, code: 'USER_REQUIRED' });
      }

      const { start, end } = this.validateTimeRange(payload.startTime, payload.endTime);

      const room = await RoomModel.findById(payload.roomId);
      if (!room) {
        throw new AppError('Room not found', { statusCode: 404, code: 'ROOM_NOT_FOUND' });
      }

      const overlapping = await BookingModel.findOverlapping(
        payload.roomId,
        start.toISOString(),
        end.toISOString()
      );

      if (overlapping.length > 0) {
        const conflict = overlapping[0];
        throw new AppError('Room already booked', {
          statusCode: 409,
          code: 'ROOM_ALREADY_BOOKED',
          details: {
            existingBookingId: conflict.id,
            startTime: conflict.startTime,
            endTime: conflict.endTime
          }
        });
      }

      const totalPrice = calculateDynamicPrice({
        baseHourlyRate: room.baseHourlyRate,
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });

      const booking = await BookingModel.create({
        roomId: payload.roomId,
        userName,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        totalPrice,
        status: 'CONFIRMED'
      });

      return this.withRoomName(booking);
    });
  }

  async cancelBooking(payload: CancelBookingInput) {
    const booking = await BookingModel.findById(payload.bookingId);

    if (!booking) {
      throw new AppError('Booking not found', {
        statusCode: 404,
        code: 'BOOKING_NOT_FOUND'
      });
    }

    if (booking.status === 'CANCELLED') {
      return booking;
    }

    const startTime = new Date(booking.startTime);

    if (Number.isNaN(startTime.getTime())) {
      throw new AppError('Booking start time is invalid', {
        statusCode: 400,
        code: 'INVALID_BOOKING_TIME'
      });
    }

    const now = Date.now();
    const window = startTime.getTime() - now;

    if (window <= TWO_HOURS_IN_MS) {
      throw new AppError('Cancellations allowed only >2 hours before start time', {
        statusCode: 400,
        code: 'CANCELLATION_WINDOW_CLOSED'
      });
    }

    const updated = await BookingModel.updateStatus(booking.id, 'CANCELLED');
    return this.withRoomName(updated);
  }

  private async withRoomName(booking: BookingEntity) {
    const room = await RoomModel.findById(booking.roomId);
    return {
      ...booking,
      roomName: room?.name ?? booking.roomId
    };
  }

  private validateFilters(filters: BookingFilters): BookingFilters {
    const result: BookingFilters = {};

    if (filters.roomId) {
      result.roomId = filters.roomId;
    }

    if (filters.status) {
      this.assertStatus(filters.status);
      result.status = filters.status;
    }

    if (filters.from) {
      this.assertValidDate(filters.from, 'from');
      result.from = filters.from;
    }

    if (filters.to) {
      this.assertValidDate(filters.to, 'to');
      result.to = filters.to;
    }

    return result;
  }

  private validateTimeRange(startInput: string, endInput: string) {
    if (!startInput || !endInput) {
      throw new AppError('startTime and endTime are required', {
        statusCode: 400,
        code: 'TIME_REQUIRED'
      });
    }

    const start = new Date(startInput);
    const end = new Date(endInput);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new AppError('startTime and endTime must be valid ISO-8601 timestamps', {
        statusCode: 400,
        code: 'INVALID_TIME_FORMAT'
      });
    }

    if (start.getTime() >= end.getTime()) {
      throw new AppError('startTime must be earlier than endTime', {
        statusCode: 400,
        code: 'INVALID_TIME_RANGE'
      });
    }

    if (end.getTime() - start.getTime() > MAX_DURATION_MS) {
      throw new AppError('Booking duration cannot exceed 12 hours', {
        statusCode: 400,
        code: 'MAX_DURATION_EXCEEDED'
      });
    }

    if (start.getTime() < Date.now()) {
      throw new AppError('Bookings must start in the future', {
        statusCode: 400,
        code: 'PAST_START_TIME'
      });
    }

    return { start, end };
  }

  private assertValidDate(value: string, field: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new AppError(`${field} must be a valid ISO date`, {
        statusCode: 400,
        code: 'INVALID_FILTER_DATE',
        details: { field }
      });
    }
  }

  private assertStatus(value: BookingStatus) {
    const allowed: BookingStatus[] = ['CONFIRMED', 'CANCELLED'];
    if (!allowed.includes(value)) {
      throw new AppError('status filter is invalid', {
        statusCode: 400,
        code: 'INVALID_STATUS',
        details: { value }
      });
    }
  }
}

export const bookingService = new BookingService();
