import { apiClient, buildQueryString } from './client';
import { Booking, BookingFilters, CreateBookingPayload } from './types';

const basePath = '/api/bookings';

export const BookingsApi = {
  async list(filters: BookingFilters = {}) {
    const query = buildQueryString(filters);
    return apiClient.get<Booking[]>(`${basePath}${query}`);
  },
  async create(payload: CreateBookingPayload) {
    return apiClient.post<Booking>(basePath, payload);
  },
  async cancel(id: string) {
    return apiClient.post<Booking>(`${basePath}/${id}/cancel`);
  }
};
