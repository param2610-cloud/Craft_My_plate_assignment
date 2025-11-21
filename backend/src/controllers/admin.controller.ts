import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service.js';

const resetDatabase = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.resetDatabase();
    res.status(202).json({ message: 'Database cleared' });
  } catch (error) {
    next(error as Error);
  }
};

export const adminController = {
  resetDatabase
};
