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
 * @openapi
 * /api/v1/adjutor/karma/{identityType}/{identity}:
 *   get:
 *     tags:
 *       - Adjutor
 *     summary: Check Adjutor Karma blacklist status
 *     description: |
 *       Query the Adjutor Karma API to check if an identity (BVN, email, or phone) is blacklisted.
 *       
 *       **Authentication:** Required (Bearer token)
 *       
 *       **How It Works:**
 *       - Our API accepts `identityType` for validation and logging purposes
 *       - Internally calls Adjutor's API: `POST /v2/verification/karma/{identity}`
 *       - Adjutor auto-detects identity type from the format (BVN, email, phone, etc.)
 *       
 *       **Purpose:**
 *       - Used internally during user signup to prevent blacklisted users from onboarding
 *       - Can be used for testing/debugging blacklist checks
 *       - Connects to external Adjutor API service
 *       
 *       **Identity Types:**
 *       - `bvn`: Bank Verification Number (11 digits)
 *       - `email`: Email address
 *       - `phone`: Phone number in international format
 *       
 *       **Important Notes:**
 *       - BVN is used for verification but NOT stored in the database
 *       - Requires Adjutor API key (configured via environment variables)
 *       - If your Adjutor app is in "Test Mode", all checks return mock data
 *       - Switch to "Live Mode" in Adjutor dashboard for real blacklist checks
 *     operationId: checkKarmaBlacklist
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [bvn, email, phone]
 *         description: Type of identity to check
 *         example: "bvn"
 *       - in: path
 *         name: identity
 *         required: true
 *         schema:
 *           type: string
 *         description: The identity value to check against the blacklist
 *         examples:
 *           bvn:
 *             value: "12345678901"
 *             summary: BVN example
 *           email:
 *             value: "user@example.com"
 *             summary: Email example
 *           phone:
 *             value: "+2348012345678"
 *             summary: Phone example
 *     responses:
 *       200:
 *         description: Karma check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/KarmaCheckResponse'
 *                 - $ref: '#/components/schemas/KarmaBlacklistedResponse'
 *             examples:
 *               notBlacklisted:
 *                 summary: User is not blacklisted
 *                 value:
 *                   success: true
 *                   message: "Karma check completed"
 *                   data:
 *                     identityType: "bvn"
 *                     identity: "12345678901"
 *                     isBlacklisted: false
 *                     reason: null
 *                     karma:
 *                       status: "clear"
 *                       message: "No negative records found"
 *               blacklisted:
 *                 summary: User is blacklisted
 *                 value:
 *                   success: true
 *                   message: "Karma check completed"
 *                   data:
 *                     identityType: "bvn"
 *                     identity: "12345678901"
 *                     isBlacklisted: true
 *                     reason: "Multiple loan defaults"
 *                     karma:
 *                       status: "blacklisted"
 *                       message: "User has negative credit history"
 *       400:
 *         description: Validation error (invalid identity type or format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               error: "Validation Error"
 *               message: "Invalid request data"
 *               details:
 *                 - field: "identityType"
 *                   message: "Identity type must be one of: bvn, email, phone"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       500:
 *         description: Internal server error or Adjutor API failure
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/InternalServerErrorResponse'
 *                 - $ref: '#/components/schemas/AdjutorApiErrorResponse'
 *             examples:
 *               adjutorApiError:
 *                 summary: Adjutor API is unavailable
 *                 value:
 *                   success: false
 *                   error: "Service Unavailable"
 *                   message: "Failed to connect to Adjutor API"
 *                   details:
 *                     reason: "External service timeout"
 */
router.get(
  "/karma/:identityType/:identity",
  authMiddleware,
  validateRequest(checkKarmaSchema),
  AdjutorController.checkKarma
);

export default router;

