/**
 * User Routes
 * 
 * Handles user-related endpoints.
 * 
 * @module routes/users
 */

import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validator";
import { getUserSchema } from "../utils/validation";

const router = Router();

/**
 * GET /api/v1/users/:id
 * Get user details by ID
 * 
 * Path parameters:
 * - id: string (required, valid UUID)
 * 
 * Requires authentication
 */
router.get(
  "/:id",
  authMiddleware,
  validateRequest(getUserSchema),
  UserController.getById
);

export default router;

