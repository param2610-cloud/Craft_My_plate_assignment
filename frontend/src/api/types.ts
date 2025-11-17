export interface Room {
  id: string;
  name: string;
  baseHourlyRate: number;
  capacity: number;
  metadata?: Record<string, unknown>;
}

export interface CreateRoomPayload {
  name: string;
  baseHourlyRate: number;
  capacity: number;
  metadata?: Record<string, unknown>;
}

export interface Booking {
  id: string;
  roomId: string;
  roomName?: string;
  userName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  roomId: string;
  userName: string;
  startTime: string;
  endTime: string;
}

export interface BookingFilters {
  roomId?: string;
  status?: 'CONFIRMED' | 'CANCELLED';
  from?: string;
  to?: string;
}

export interface AnalyticsRow {
  roomId: string;
  roomName: string;
  totalHours: number;
  totalRevenue: number;
}

export type AnalyticsFilters = {
  [key: string]: string | undefined;
  from?: string;
  to?: string;
};
