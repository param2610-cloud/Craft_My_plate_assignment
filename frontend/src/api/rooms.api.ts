import { apiClient } from './client';
import { CreateRoomPayload, Room } from './types';

const basePath = '/api/rooms';

export const RoomsApi = {
  async list() {
    return apiClient.get<Room[]>(basePath);
  },
  async create(payload: CreateRoomPayload) {
    return apiClient.post<Room>(basePath, payload);
  }
};
