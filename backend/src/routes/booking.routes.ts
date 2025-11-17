import { Application, Router } from 'express';
import { bookingController } from '../controllers/booking.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(bookingController.listBookings));
router.post('/', asyncHandler(bookingController.createBooking));
router.post('/:id/cancel', asyncHandler(bookingController.cancelBooking));

export const registerBookingRoutes = (app: Application) => {
  app.use('/api/bookings', router);
};
