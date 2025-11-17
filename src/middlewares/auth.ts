/**
 * Authentication Middleware
 * 
 * Validates authentication tokens and attaches user info to requests.
 * 
 * @module middlewares/auth
 */

import { Request, Response, NextFunction } from "express";

/**
 * Extend Express Request to include user info
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Validates Bearer token and attaches user to request
 * 
 * Expected header format: Authorization: Bearer <token>
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authorization header is required",
      });
      return;
    }
    
    // Validate Bearer token format
    const parts = authHeader.split(" ");
    
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authorization header must be in format: Bearer <token>",
      });
      return;
    }
    
    const token = parts[1];
    
    // Import token utility
    const { verifyToken } = await import("../utils/token");
    
    // Verify token and extract payload
    const payload = verifyToken(token);
    
    // Attach user to request
    req.user = {
      id: payload.userId,
    };
    
    // Continue to next middleware
    next();
  } catch (error) {
    // Token verification failed
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: error instanceof Error ? error.message : "Invalid token",
    });
  }
}

