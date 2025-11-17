import { Request, Response } from 'express';
import { roomService } from '../services/room.service.js';
import type { RoomPayload } from '../models/room.model.js';

const listRooms = async (_req: Request, res: Response) => {
  const rooms = await roomService.listRooms();
  res.json(rooms);
};

const createRoom = async (req: Request, res: Response) => {
  const payload = req.body as RoomPayload;
  const room = await roomService.createRoom(payload);
  res.status(201).json(room);
};

export const roomController = {
  listRooms,
  createRoom
};
