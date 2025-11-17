export interface DateRange {
  from: string;
  to: string;
}

export interface Room {
  id: string;
  name: string;
  baseHourlyRate: number;
  capacity: number;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface Booking {
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

export interface AnalyticsResult {
  roomId: string;
  roomName: string;
  totalHours: number;
  totalRevenue: number;
}
