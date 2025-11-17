/**
 * Authentication Controller
 * 
 * Handles authentication-related HTTP requests (signup, login).
 * 
 * @module controllers/auth.controller
 */

import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

/**
 * Authentication controller class
 */
export class AuthController {
  /**
   * Handle user signup
   * 
   * POST /api/v1/auth/signup
   * 
   * Request body:
   * - name: string
   * - email: string
   * - phone: string
   * - bvn: string (not stored)
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async signup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, phone, bvn } = req.body;

      // Create user with Adjutor check
      const result = await AuthService.createUser({
        name,
        email,
        phone,
        bvn,
      });

      // Return success response
      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            phone: result.user.phone,
            status: result.user.status,
            created_at: result.user.created_at,
          },
          token: result.token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle user login
   * 
   * POST /api/v1/auth/login
   * 
   * Request body:
   * - email?: string
   * - phone?: string
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, phone } = req.body;

      // Authenticate user
      const result = await AuthService.loginUser({ email, phone });

      // Return success response
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            phone: result.user.phone,
            status: result.user.status,
          },
          token: result.token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

