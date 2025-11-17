import { Application, Router } from 'express';
import { roomController } from '../controllers/room.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(roomController.listRooms));
router.post('/', asyncHandler(roomController.createRoom));

export const registerRoomRoutes = (app: Application) => {
  app.use('/api/rooms', router);
};
