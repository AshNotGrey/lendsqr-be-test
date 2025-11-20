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
 * @openapi
 * /api/v1/auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: |
 *       Creates a new user account with Adjutor Karma blacklist verification.
 *       
 *       **Important:** 
 *       - BVN is used for blacklist check but NOT stored in the database
 *       - User will be rejected if found in Adjutor Karma blacklist
 *       - When `ADJUTOR_MODE=live`: BVN is checked against Adjutor
 *       - When `ADJUTOR_MODE=mock`: BVN → Email → Phone are checked in order, stopping at first hit
 *       - Creates a wallet automatically with 0.00 balance
 *       - Returns JWT token for immediate authentication
 *     operationId: signup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *           examples:
 *             validUser:
 *               summary: Valid user (clean in mock mode)
 *               value:
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 phone: "+2348012345678"
 *                 bvn: "22212345679"
 *             blacklistedByBvn:
 *               summary: Blacklisted by BVN (mock sentinel)
 *               value:
 *                 name: "Bad Actor"
 *                 email: "bad@example.com"
 *                 phone: "+2348012345678"
 *                 bvn: "12345678901"
 *             blacklistedByEmail:
 *               summary: Blacklisted by Email (mock sentinel)
 *               value:
 *                 name: "Email Fraudster"
 *                 email: "blacklisted@adjutor.test"
 *                 phone: "+2348012345678"
 *                 bvn: "22212345679"
 *             blacklistedByPhone:
 *               summary: Blacklisted by Phone (mock sentinel)
 *               value:
 *                 name: "Phone Fraudster"
 *                 email: "ok@example.com"
 *                 phone: "+2341234567890"
 *                 bvn: "22212345679"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SignupResponse'
 *             example:
 *               success: true
 *               message: "User created successfully"
 *               data:
 *                 user:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   phone: "+2348012345678"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                 wallet:
 *                   id: "660f9510-f39c-52e5-b827-557766551111"
 *                   userId: "550e8400-e29b-41d4-a716-446655440000"
 *                   balance: "0.00"
 *                   currency: "NGN"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error or invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               error: "Validation Error"
 *               message: "Invalid request data"
 *               details:
 *                 - field: "bvn"
 *                   message: "BVN must be exactly 11 digits"
 *       403:
 *         description: User is blacklisted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlacklistedUserResponse'
 *             example:
 *               success: false
 *               error: "Forbidden"
 *               message: "User is blacklisted and cannot be onboarded"
 *               details:
 *                 reason: "Found in Adjutor Karma blacklist"
 *       409:
 *         description: User already exists (email or phone conflict)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Conflict"
 *               message: "User with this email or phone already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 */
router.post("/signup", validateRequest(signupSchema), AuthController.signup);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login to the system
 *     description: |
 *       Authenticate a user using email OR phone number.
 *       
 *       **Authentication:**
 *       - Provide either email or phone (at least one required)
 *       - Returns JWT token for use in protected endpoints
 *       - Token should be included in Authorization header as: `Bearer <token>`
 *     operationId: login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             loginWithEmail:
 *               summary: Login with email
 *               value:
 *                 email: "john.doe@example.com"
 *             loginWithPhone:
 *               summary: Login with phone
 *               value:
 *                 phone: "+2348012345678"
 *             loginWithBoth:
 *               summary: Login with both (email used)
 *               value:
 *                 email: "john.doe@example.com"
 *                 phone: "+2348012345678"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               success: true
 *               message: "Login successful"
 *               data:
 *                 user:
 *                   id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   phone: "+2348012345678"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error (missing email and phone)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               error: "Validation Error"
 *               message: "Either email or phone is required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
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
router.post("/login", validateRequest(loginSchema), AuthController.login);

export default router;

