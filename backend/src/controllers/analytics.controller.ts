import { NextFunction, Request, Response } from 'express';
import { analyticsService } from '../analytics/analytics.service.js';

const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;
    const summary = await analyticsService.getSummary({
      from: typeof from === 'string' ? from : undefined,
      to: typeof to === 'string' ? to : undefined
    });
    res.json(summary);
  } catch (error) {
    next(error as Error);
  }
};

export const analyticsController = {
  getSummary
};
