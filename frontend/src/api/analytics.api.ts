import { apiClient, buildQueryString } from './client';
import { AnalyticsFilters, AnalyticsRow } from './types';

const basePath = '/api/analytics';

export const AnalyticsApi = {
  async list(filters: AnalyticsFilters = {}) {
    const query = buildQueryString(filters);
    return apiClient.get<AnalyticsRow[]>(`${basePath}${query}`);
  }
};
