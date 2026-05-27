import { Response } from 'express';

interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface ResponsePayload<T> {
  success: boolean;
  data: T | null;
  message: string;
  pagination?: Pagination;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  data: T | null = null,
  message: string,
  pagination?: Pagination
): Response => {
  const payload: ResponsePayload<T> = {
    success,
    data,
    message
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  return res.status(statusCode).json(payload);
};

export default sendResponse;
