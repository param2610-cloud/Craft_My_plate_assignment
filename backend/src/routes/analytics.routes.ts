import { Application, Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(analyticsController.getSummary));

export const registerAnalyticsRoutes = (app: Application) => {
  app.use('/api/analytics', router);
};
