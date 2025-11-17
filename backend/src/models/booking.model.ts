import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AsyncLock } from '../utils/lock.util.js';
import { findConflicts } from '../utils/conflict.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../data/bookings.json');

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface BookingEntity {
  id: string;
  roomId: string;
  userName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BookingCreateData {
  roomId: string;
  userName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status?: BookingStatus;
}

export interface BookingFilters {
  roomId?: string;
  status?: BookingStatus;
  from?: string;
  to?: string;
}

export interface BookingAnalyticsRow {
  roomId: string;
  totalHours: number;
  totalRevenue: number;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

class BookingRepository {
  private bookings: BookingEntity[] = [];

  private initialized = false;

  private fileLock = new AsyncLock();

  private roundCurrency(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private clampDateRange(date: Date, fromBoundary?: number, toBoundary?: number) {
    const timestamp = date.getTime();
    if (Number.isNaN(timestamp)) {
      return false;
    }
    if (typeof fromBoundary === 'number' && timestamp < fromBoundary) {
      return false;
    }
    if (typeof toBoundary === 'number' && timestamp > toBoundary) {
      return false;
    }
    return true;
  }

  private async ensureLoaded() {
    if (this.initialized) {
      return;
    }

    await this.fileLock.runExclusive(async () => {
      if (this.initialized) {
        return;
      }

      if (!existsSync(DATA_FILE)) {
        await mkdir(path.dirname(DATA_FILE), { recursive: true });
        await writeFile(DATA_FILE, '[]', 'utf-8');
        this.bookings = [];
      } else {
        const raw = await readFile(DATA_FILE, 'utf-8');
        this.bookings = raw ? (JSON.parse(raw) as BookingEntity[]) : [];
      }

      this.initialized = true;
    });
  }

  private async persist() {
    await writeFile(DATA_FILE, JSON.stringify(this.bookings, null, 2), 'utf-8');
  }

  private generateId() {
    return `booking_${randomUUID()}`;
  }

  private toDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  async findAll(filters: BookingFilters = {}): Promise<BookingEntity[]> {
    await this.ensureLoaded();
    const fromBoundary = filters.from ? new Date(filters.from).getTime() : undefined;
    const toBoundary = filters.to ? new Date(filters.to).getTime() : undefined;

    return this.bookings
      .filter((booking) => {
        if (filters.roomId && booking.roomId !== filters.roomId) {
          return false;
        }
        if (filters.status && booking.status !== filters.status) {
          return false;
        }
        if (fromBoundary && new Date(booking.startTime).getTime() < fromBoundary) {
          return false;
        }
        if (toBoundary && new Date(booking.endTime).getTime() > toBoundary) {
          return false;
        }
        return true;
      })
      .map((booking) => ({ ...booking }));
  }

  async findById(id: string): Promise<BookingEntity | null> {
    await this.ensureLoaded();
    const booking = this.bookings.find((entry) => entry.id === id);
    return booking ? { ...booking } : null;
  }

  async findOverlapping(roomId: string, startTime: string, endTime: string) {
    await this.ensureLoaded();
    const relevant = this.bookings.filter(
      (booking) => booking.roomId === roomId && booking.status === 'CONFIRMED'
    );

    return findConflicts({ startTime, endTime }, relevant).map((booking) => ({ ...booking }));
  }

  async create(payload: BookingCreateData): Promise<BookingEntity> {
    const nowIso = new Date().toISOString();
    const entity: BookingEntity = {
      id: this.generateId(),
      roomId: payload.roomId,
      userName: payload.userName,
      startTime: payload.startTime,
      endTime: payload.endTime,
      totalPrice: payload.totalPrice,
      status: payload.status ?? 'CONFIRMED',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await this.ensureLoaded();

    await this.fileLock.runExclusive(async () => {
      this.bookings.push(entity);
      await this.persist();
    });

    return { ...entity };
  }

  async updateStatus(id: string, status: BookingStatus): Promise<BookingEntity> {
    let updated: BookingEntity | null = null;

    await this.ensureLoaded();

    await this.fileLock.runExclusive(async () => {
      const index = this.bookings.findIndex((booking) => booking.id === id);
      if (index === -1) {
        throw new Error('Booking not found');
      }

      const next: BookingEntity = {
        ...this.bookings[index],
        status,
        updatedAt: new Date().toISOString()
      };

      this.bookings[index] = next;
      updated = next;
      await this.persist();
    });

    if (!updated) {
      throw new Error('Unable to update booking');
    }

    return { ...(updated as BookingEntity) };
  }

  async aggregate(from?: string, to?: string): Promise<BookingAnalyticsRow[]> {
    await this.ensureLoaded();
    const fromBoundary = from ? new Date(from).getTime() : undefined;
    const toBoundary = to ? new Date(to).getTime() + DAY_MS - 1 : undefined;

    const summaryMap = this.bookings
      .filter((booking) => booking.status === 'CONFIRMED')
      .filter((booking) => {
        const startDate = new Date(booking.startTime);
        const endDate = new Date(booking.endTime);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          return false;
        }
        const withinStart = this.clampDateRange(startDate, fromBoundary, toBoundary);
        const withinEnd = this.clampDateRange(endDate, fromBoundary, toBoundary);
        return withinStart && withinEnd;
      })
      .reduce<Map<string, { roomId: string; totalMinutes: number; totalRevenue: number }>>(
        (acc, booking) => {
          const start = new Date(booking.startTime).getTime();
          const end = new Date(booking.endTime).getTime();
          const minutes = Math.max(0, (end - start) / MINUTE_MS);
          const bucket = acc.get(booking.roomId) ?? {
            roomId: booking.roomId,
            totalMinutes: 0,
            totalRevenue: 0
          };

          bucket.totalMinutes += minutes;
          bucket.totalRevenue = this.roundCurrency(bucket.totalRevenue + booking.totalPrice);

          acc.set(booking.roomId, bucket);
          return acc;
        },
        new Map()
      );

    return Array.from(summaryMap.values()).map((entry) => ({
      roomId: entry.roomId,
      totalHours: Math.round((entry.totalMinutes / 60) * 100) / 100,
      totalRevenue: this.roundCurrency(entry.totalRevenue)
    }));
  }
}

export const BookingModel = new BookingRepository();
