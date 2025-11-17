/**
 * Authentication OpenAPI Schema Definitions
 * 
 * Schema components for authentication endpoints including
 * signup and login request/response structures.
 * 
 * @module docs/schemas/auth
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     SignupRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - bvn
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: User's full name
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           pattern: '^\+?[1-9]\d{1,14}$'
 *           description: User's phone number in international format
 *           example: "+2348012345678"
 *         bvn:
 *           type: string
 *           pattern: '^\d{11}$'
 *           minLength: 11
 *           maxLength: 11
 *           description: Bank Verification Number (11 digits). Used for Adjutor Karma blacklist check but NOT stored in database.
 *           example: "12345678901"
 *       description: User registration request payload
 * 
 *     SignupResponse:
 *       type: object
 *       required:
 *         - success
 *         - message
 *         - data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "User created successfully"
 *         data:
 *           type: object
 *           required:
 *             - user
 *             - wallet
 *             - token
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *                 phone:
 *                   type: string
 *                   example: "+2348012345678"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *             wallet:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "660f9510-f39c-52e5-b827-557766551111"
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 balance:
 *                   type: string
 *                   description: Wallet balance in decimal format
 *                   example: "0.00"
 *                 currency:
 *                   type: string
 *                   example: "NGN"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *             token:
 *               type: string
 *               description: JWT authentication token (faux auth implementation)
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       description: Successful signup response with user, wallet, and authentication token
 * 
 *     LoginRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address (required if phone is not provided)
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           pattern: '^\+?[1-9]\d{1,14}$'
 *           description: User's phone number (required if email is not provided)
 *           example: "+2348012345678"
 *       description: Login request payload. Either email or phone must be provided.
 *       oneOf:
 *         - required:
 *             - email
 *         - required:
 *             - phone
 * 
 *     LoginResponse:
 *       type: object
 *       required:
 *         - success
 *         - message
 *         - data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Login successful"
 *         data:
 *           type: object
 *           required:
 *             - user
 *             - token
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *                 phone:
 *                   type: string
 *                   example: "+2348012345678"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *             token:
 *               type: string
 *               description: JWT authentication token
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       description: Successful login response with user and authentication token
 * 
 *     BlacklistedUserResponse:
 *       type: object
 *       required:
 *         - success
 *         - error
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Forbidden"
 *         message:
 *           type: string
 *           example: "User is blacklisted and cannot be onboarded"
 *         details:
 *           type: object
 *           properties:
 *             reason:
 *               type: string
 *               example: "Found in Adjutor Karma blacklist"
 *       description: Response when user is found in Adjutor Karma blacklist during signup
 */

export {};

