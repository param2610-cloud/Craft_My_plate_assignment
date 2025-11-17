import { RoomModel } from '../models/room.model.js';

export const seedRooms = async () => {
  if ((await RoomModel.findAll()).length > 0) {
    return;
  }

  await RoomModel.create({ name: 'Focus Cabin', baseHourlyRate: 500, capacity: 2 });
  await RoomModel.create({ name: 'War Room', baseHourlyRate: 900, capacity: 8 });
  await RoomModel.create({ name: 'Townhall', baseHourlyRate: 1500, capacity: 20 });
};
