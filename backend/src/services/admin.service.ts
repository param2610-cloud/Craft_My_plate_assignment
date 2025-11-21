import { BookingModel } from '../models/booking.model.js';
import { RoomModel } from '../models/room.model.js';

class AdminService {
  async resetDatabase() {
    await BookingModel.clearAll();
    await RoomModel.reset();
  }
}

export const adminService = new AdminService();
