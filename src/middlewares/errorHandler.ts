import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { isDevelopment } from '../config/env';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      ...(error.details && { details: error.details }),
    });
    return;
  }

  console.error('Internal Server Error:', error);

  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment() ? error.message : 'Something went wrong',
  });
}
