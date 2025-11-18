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
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user details by ID
 *     description: |
 *       Retrieves detailed information about a specific user by their UUID.
 *       
 *       **Authentication:** Required (Bearer token)
 *       
 *       **Security:**
 *       - Users can ONLY view their own details
 *       - Returns 403 Forbidden if attempting to access another user's information
 *       - This protects user privacy and prevents PII enumeration
 *       
 *       **Notes:**
 *       - Returns basic user profile information
 *       - Does not include sensitive data like BVN
 *       - The `id` parameter must match the authenticated user's ID
 *     operationId: getUserById
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User's unique identifier (UUID)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetUserResponse'
 *             example:
 *               success: true
 *               message: "User retrieved successfully"
 *               data:
 *                 user:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   phone: "+2348012345678"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Invalid UUID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               error: "Validation Error"
 *               message: "Invalid request data"
 *               details:
 *                 - field: "id"
 *                   message: "Invalid UUID format"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       403:
 *         description: Forbidden - Attempting to access another user's details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "You can only access your own user details"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserNotFoundResponse'
 *             example:
 *               success: false
 *               error: "Not Found"
 *               message: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 */
router.get(
  "/:id",
  authMiddleware,
  validateRequest(getUserSchema),
  UserController.getById
);

export default router;

