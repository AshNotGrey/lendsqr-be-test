/**
 * Authentication Routes
 * 
 * Handles user signup and login endpoints.
 * 
 * @module routes/auth
 */

import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validator";
import { signupSchema, loginSchema } from "../utils/validation";

const router = Router();

/**
 * POST /api/v1/auth/signup
 * Register a new user with Adjutor blacklist check
 * 
 * Request body:
 * - name: string (required)
 * - email: string (required, valid email)
 * - phone: string (required, international format)
 * - bvn: string (required, 11 digits)
 */
router.post("/signup", validateRequest(signupSchema), AuthController.signup);

/**
 * POST /api/v1/auth/login
 * Login with email or phone
 * 
 * Request body:
 * - email?: string (valid email)
 * - phone?: string (international format)
 * - At least one of email or phone is required
 */
router.post("/login", validateRequest(loginSchema), AuthController.login);

export default router;

