import { apiClient, buildQueryString } from './client';
import { Booking, BookingListParams, CreateBookingPayload, PaginatedResponse } from './types';

const basePath = '/api/bookings';

export const BookingsApi = {
  async list(params: BookingListParams = {}) {
    const query = buildQueryString(params as Record<string, string | number | undefined>);
    return apiClient.get<PaginatedResponse<Booking>>(`${basePath}${query}`);
  },
  async create(payload: CreateBookingPayload) {
    return apiClient.post<Booking>(basePath, payload);
  },
  async cancel(id: string) {
    return apiClient.post<Booking>(`${basePath}/${id}/cancel`);
  }
};
