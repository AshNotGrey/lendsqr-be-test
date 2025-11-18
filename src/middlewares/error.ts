/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the application.
 * 
 * @module middlewares/error
 */

import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

/**
 * Custom application error class
 */
export class AppError extends Error {
  public override message: string;
  
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.message = message;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Map HTTP status codes to error type names
 * 
 * @param statusCode - HTTP status code
 * @returns Error type string (e.g., "Forbidden", "Not Found")
 */
function getErrorType(statusCode: number): string {
  const errorTypes: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Validation Error",
    500: "Internal Server Error",
  };

  return errorTypes[statusCode] || "Error";
}

/**
 * Global error handler middleware
 * 
 * Handles all errors thrown in the application and formats them
 * according to the API documentation specification.
 * 
 * @param err - Error object (Error or AppError)
 * @param req - Express request
 * @param res - Express response
 * @param _next - Express next function (unused)
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let message = "Internal Server Error";

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // For non-AppError instances, use the error message
    message = err.message || "Internal Server Error";
  }

  // Get error type based on status code
  const errorType = getErrorType(statusCode);

  // Log error
  console.error("❌ Error:", {
    statusCode,
    errorType,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Send error response matching API documentation format
  res.status(statusCode).json({
    success: false,
    error: errorType,
    message: message,
    ...(config.nodeEnv === "development" && {
      stack: err.stack,
      details: err.message,
    }),
  });
}

