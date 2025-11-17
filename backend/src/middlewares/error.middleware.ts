import { NextFunction, Request, Response } from 'express';
import { AppError, isAppError } from '../utils/errors.js';

const generateTraceId = () => `trace_${Math.random().toString(36).slice(2, 10)}`;

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  void _next;
  const traceId = (req.headers['x-trace-id'] as string) ?? generateTraceId();
  const appError = isAppError(err)
    ? err
    : new AppError('Internal Server Error', { statusCode: 500, code: 'INTERNAL_ERROR' });

  if (!isAppError(err)) {
    console.error('Unhandled error', { traceId, path: req.path, error: err });
  }

  res.status(appError.statusCode).json({
    error: appError.message,
    code: appError.code,
    details: appError.details,
    traceId
  });
};
