import type { NextFunction, Request, RequestHandler, Response } from 'express';

type MaybePromiseHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export const asyncHandler = (handler: MaybePromiseHandler): RequestHandler => {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
};
