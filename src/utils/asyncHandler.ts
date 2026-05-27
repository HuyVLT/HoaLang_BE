import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandlerFunction = (req: Request, res: Response, next: NextFunction) => Promise<any> | any;

export const asyncHandler = (fn: AsyncHandlerFunction): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
