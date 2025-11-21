import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bookingService } from '../services/booking.service.js';
import { seedRooms } from '../seed/seedRooms.js';
import { RoomModel } from '../models/room.model.js';
import { analyticsService } from '../analytics/analytics.service.js';
import { AppError } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOOKINGS_FILE = path.resolve(__dirname, '../../data/bookings.json');
const IST_OFFSET_MINUTES = 330;

interface ScenarioResult {
  name: string;
  passed: boolean;
  details?: string;
}

const pad = (value: number) => value.toString().padStart(2, '0');
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const getIstWeekday = (date: Date) => {
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return istDate.getUTCDay();
};

const getFutureBusinessDate = () => {
  let candidate = addDays(new Date(), 1);
  while ([0, 6].includes(getIstWeekday(candidate))) {
    candidate = addDays(candidate, 1);
  }
  return candidate;
};

const toIstDateString = (date: Date) => {
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return istDate.toISOString().split('T')[0];
};

const toIstIsoString = (date: Date, hour: number, minute: number) => {
  const dateString = toIstDateString(date);
  return `${dateString}T${pad(hour)}:${pad(minute)}:00+05:30`;
};

const resetBookings = async () => {
  await rm(BOOKINGS_FILE, { force: true });
};

const run = async () => {
  const results: ScenarioResult[] = [];

  await resetBookings();
  await seedRooms();
  const rooms = await RoomModel.findAll();
  const focusRoom = rooms.find((room) => room.name === 'Focus Cabin') ?? rooms[0];
  const warRoom = rooms.find((room) => room.name === 'War Room') ?? rooms[1] ?? rooms[0];
  const pricingRoom = await RoomModel.create({ name: 'Pricing Test Room', baseHourlyRate: 600, capacity: 4 });

  const bookingDate = getFutureBusinessDate();

  const slotAStart = toIstIsoString(bookingDate, 9, 0);
  const slotAEnd = toIstIsoString(bookingDate, 10, 0);
  const slotBStart = toIstIsoString(bookingDate, 10, 0);
  const slotBEnd = toIstIsoString(bookingDate, 11, 0);

  try {
    const bookingA = await bookingService.createBooking({
      roomId: focusRoom.id,
      userName: 'Scenario User A',
      startTime: slotAStart,
      endTime: slotAEnd
    });
    const bookingB = await bookingService.createBooking({
      roomId: focusRoom.id,
      userName: 'Scenario User B',
      startTime: slotBStart,
      endTime: slotBEnd
    });
    results.push({
      name: 'Scenario 1: Non-overlapping bookings succeed',
      passed: Boolean(bookingA.id && bookingB.id)
    });
  } catch (error) {
    results.push({
      name: 'Scenario 1: Non-overlapping bookings succeed',
      passed: false,
      details: String(error)
    });
  }

  try {
    await bookingService.createBooking({
      roomId: focusRoom.id,
      userName: 'Scenario Overlap',
      startTime: toIstIsoString(bookingDate, 9, 30),
      endTime: toIstIsoString(bookingDate, 10, 30)
    });
    results.push({
      name: 'Scenario 2: Overlapping booking rejected',
      passed: false,
      details: 'Expected conflict but booking succeeded.'
    });
  } catch (error) {
    const appError = error as AppError;
    results.push({
      name: 'Scenario 2: Overlapping booking rejected',
      passed: appError.code === 'ROOM_ALREADY_BOOKED',
      details: appError.code
    });
  }

  try {
    const peakBooking = await bookingService.createBooking({
      roomId: pricingRoom.id,
      userName: 'Pricing Test',
      startTime: toIstIsoString(bookingDate, 9, 30),
      endTime: toIstIsoString(bookingDate, 10, 30)
    });
    const perMinuteRate = pricingRoom.baseHourlyRate / 60;
    const expectedPrice = Math.round(30 * perMinuteRate + 30 * perMinuteRate * 1.5);
    results.push({
      name: 'Scenario 3: Peak/off-peak pricing accuracy',
      passed: peakBooking.totalPrice === expectedPrice,
      details: `Expected ${expectedPrice}, got ${peakBooking.totalPrice}`
    });
  } catch (error) {
    results.push({
      name: 'Scenario 3: Peak/off-peak pricing accuracy',
      passed: false,
      details: String(error)
    });
  }

  try {
    const cancelStart = toIstIsoString(bookingDate, 13, 0);
    const cancelEnd = toIstIsoString(bookingDate, 14, 0);
    const cancelBooking = await bookingService.createBooking({
      roomId: warRoom.id,
      userName: 'Cancel Later',
      startTime: cancelStart,
      endTime: cancelEnd
    });
    await bookingService.cancelBooking({ bookingId: cancelBooking.id });

    const shortWindowStartDate = new Date(Date.now() + 90 * 60 * 1000);
    const shortWindowEndDate = new Date(shortWindowStartDate.getTime() + 60 * 60 * 1000);
    const shortBooking = await bookingService.createBooking({
      roomId: warRoom.id,
      userName: 'Cancel Soon',
      startTime: shortWindowStartDate.toISOString(),
      endTime: shortWindowEndDate.toISOString()
    });

    let prevented = false;
    try {
      await bookingService.cancelBooking({ bookingId: shortBooking.id });
    } catch (error) {
      prevented = (error as AppError).code === 'CANCELLATION_WINDOW_CLOSED';
    }

    results.push({
      name: 'Scenario 4: Cancellation window enforcement',
      passed: prevented
    });
  } catch (error) {
    results.push({
      name: 'Scenario 4: Cancellation window enforcement',
      passed: false,
      details: String(error)
    });
  }

  try {
    const concurrencyStart = toIstIsoString(bookingDate, 15, 0);
    const concurrencyEnd = toIstIsoString(bookingDate, 16, 0);

    const [first, second] = await Promise.allSettled([
      bookingService.createBooking({
        roomId: focusRoom.id,
        userName: 'Concurrent A',
        startTime: concurrencyStart,
        endTime: concurrencyEnd
      }),
      bookingService.createBooking({
        roomId: focusRoom.id,
        userName: 'Concurrent B',
        startTime: concurrencyStart,
        endTime: concurrencyEnd
      })
    ]);

    const fulfilled = [first, second].filter((result) => result.status === 'fulfilled');
    const rejected = [first, second].filter((result) => result.status === 'rejected');
    const rejectedConflict = rejected.every((result) => result.status === 'rejected' && (result.reason as AppError).code === 'ROOM_ALREADY_BOOKED');

    results.push({
      name: 'Scenario 5: Concurrent booking guard',
      passed: fulfilled.length === 1 && rejectedConflict
    });
  } catch (error) {
    results.push({
      name: 'Scenario 5: Concurrent booking guard',
      passed: false,
      details: String(error)
    });
  }

  try {
    const from = toIstDateString(addDays(new Date(), -1));
    const to = toIstDateString(addDays(new Date(), 7));
    const summary = await analyticsService.getSummary({ from, to });
    const totalRevenue = summary.reduce((sum, row) => sum + row.totalRevenue, 0);
    const bookingList = await bookingService.listBookings({}, { pageSize: 500 });
    const confirmedRevenue = bookingList.data
      .filter((booking) => booking.status === 'CONFIRMED')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);
    const matches = summary.length > 0 && totalRevenue === confirmedRevenue;
    results.push({
      name: 'Scenario 6: Analytics excludes cancelled bookings',
      passed: matches,
      details: `Analytics revenue ${totalRevenue} vs confirmed revenue ${confirmedRevenue}`
    });
  } catch (error) {
    results.push({
      name: 'Scenario 6: Analytics excludes cancelled bookings',
      passed: false,
      details: String(error)
    });
  }

  results.forEach((result) => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}${result.details ? ` — ${result.details}` : ''}`);
  });

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
