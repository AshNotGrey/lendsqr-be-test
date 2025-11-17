/**
 * Validation Middleware
 * 
 * Request validation using Zod schemas.
 * 
 * @module middlewares/validator
 */

import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Validate request against Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateRequest(schema: AnyZodObject) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate request body, params, and query
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: "Invalid request data",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }

      next(error);
    }
  };
}

