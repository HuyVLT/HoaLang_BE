import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log non-operational errors for engineering debugging
  if (statusCode === 500) {
    console.error('Unhandled Server Exception:', err);
  } else {
    console.error('Client/Operational Error:', {
      name: err.name,
      message: err.message,
      statusCode
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for path: ${err.path}`;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 422;
    const errors = Object.values(err.errors).map((e: any) => e.message);
    message = `Validation failed: ${errors.join(', ')}`;
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicateKey = Object.keys(err.keyValue || {})[0];
    message = `Unique restriction violation. Duplicate value for key: ${duplicateKey}`;
  }

  // JWT Errors
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication token signature is invalid.';
  }

  return sendResponse(res, statusCode, false, null, message);
};

export default errorHandler;
