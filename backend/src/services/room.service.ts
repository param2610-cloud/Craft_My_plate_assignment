import { RoomModel, RoomPayload } from '../models/room.model.js';

const listRooms = async () => {
  return RoomModel.findAll();
};

const createRoom = async (payload: RoomPayload) => {
  return RoomModel.create(payload);
};

export const roomService = {
  listRooms,
  createRoom
};
