import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '../utils/logger.js';

/**
 * Middleware de validation utilisant Zod
 * @param schema Le schéma Zod à valider par rapport au body de la requête
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`Validation Error: ${JSON.stringify(error.errors)}`);
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error during validation',
      });
    }
  };
};
