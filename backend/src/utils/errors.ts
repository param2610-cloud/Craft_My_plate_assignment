export interface ErrorDetails {
  [key: string]: unknown;
}

interface AppErrorOptions {
  statusCode?: number;
  code?: string;
  details?: ErrorDetails;
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: ErrorDetails;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? 'INTERNAL_ERROR';
    this.details = options.details;
  }
}

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};
