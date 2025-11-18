/**
 * User Controller
 * 
 * Handles user-related HTTP requests.
 * 
 * @module controllers/user.controller
 */

import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

/**
 * User controller class
 */
export class UserController {
  /**
   * Get user by ID
   * 
   * GET /api/v1/users/:id
   * 
   * **Security:** Users can only view their own details.
   * Returns 403 Forbidden if attempting to access another user's details.
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const authenticatedUserId = req.user?.id; // Set by authMiddleware

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: "User ID is required",
        });
        return;
      }

      // Security check: Users can only view their own details
      if (id !== authenticatedUserId) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "You can only access your own user details",
        });
        return;
      }

      // Fetch user
      const user = await UserService.getUserById(id);

      // Return success response
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status,
            created_at: user.created_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

