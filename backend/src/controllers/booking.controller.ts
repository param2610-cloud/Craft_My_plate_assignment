import { NextFunction, Request, Response } from 'express';
import { bookingService, CreateBookingInput } from '../services/booking.service.js';
import { BookingFilters } from '../models/booking.model.js';
import { AppError } from '../utils/errors.js';

const listBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: BookingFilters = {
      roomId: typeof req.query.roomId === 'string' ? req.query.roomId : undefined,
      status: typeof req.query.status === 'string' ? (req.query.status as BookingFilters['status']) : undefined,
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined
    };

    const bookings = await bookingService.listBookings(filters);
    res.json(bookings);
  } catch (error) {
    next(error as Error);
  }
};

const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as CreateBookingInput;
    const booking = await bookingService.createBooking(payload);
    res.status(201).json(booking);
  } catch (error) {
    next(error as Error);
  }
};

const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingId = req.params.id;
    if (!bookingId) {
      throw new AppError('Booking id is required', { statusCode: 400, code: 'BOOKING_ID_REQUIRED' });
    }
    const booking = await bookingService.cancelBooking({ bookingId });
    res.json(booking);
  } catch (error) {
    next(error as Error);
  }
};

export const bookingController = {
  listBookings,
  createBooking,
  cancelBooking
};
