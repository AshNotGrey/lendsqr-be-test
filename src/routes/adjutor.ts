/**
 * Adjutor Routes
 * 
 * Handles Adjutor Karma blacklist check endpoints (for testing/debugging).
 * 
 * @module routes/adjutor
 */

import { Router } from "express";
import { AdjutorController } from "../controllers/adjutor.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validator";
import { checkKarmaSchema } from "../utils/validation";

const router = Router();

/**
 * GET /api/v1/adjutor/karma/:identityType/:identity
 * Check Adjutor Karma blacklist
 * 
 * Path parameters:
 * - identityType: string (required, must be 'bvn' | 'email' | 'phone')
 * - identity: string (required, the identity value to check)
 * 
 * Requires authentication
 */
router.get(
  "/karma/:identityType/:identity",
  authMiddleware,
  validateRequest(checkKarmaSchema),
  AdjutorController.checkKarma
);

export default router;

