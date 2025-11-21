import { Application, Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { adminController } from '../controllers/admin.controller.js';

const router = Router();

router.post('/reset', asyncHandler(adminController.resetDatabase));

export const registerAdminRoutes = (app: Application) => {
  app.use('/api/admin', router);
};
