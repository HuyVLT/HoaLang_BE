import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error.middleware';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as { body: any; query: any; params: any };

      // Update inputs with Zod-parsed and coerced types
      req.body = validated.body;
      
      if (validated.query) {
        // Mutate existing keys to bypass read-only getter reference restrictions on req.query
        for (const key in req.query) {
          delete req.query[key];
        }
        Object.assign(req.query, validated.query);
      }

      if (validated.params) {
        // Mutate existing keys to bypass read-only getter reference restrictions on req.params
        for (const key in req.params) {
          delete req.params[key];
        }
        Object.assign(req.params, validated.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.issues.map(
          (err) => `${err.path.filter((p) => String(p) !== 'body').join('.')}: ${err.message}`
        );
        return next(
          new AppError(`Input validation failed: ${errorDetails.join('; ')}`, 400)
        );
      }
      next(error);
    }
  };
};

export default validateRequest;
