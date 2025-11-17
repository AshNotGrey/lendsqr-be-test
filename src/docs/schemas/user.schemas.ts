/**
 * User OpenAPI Schema Definitions
 * 
 * Schema components for user-related endpoints including
 * user objects and user retrieval responses.
 * 
 * @module docs/schemas/user
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *         - phone
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique user identifier
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           description: User's full name
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john.doe@example.com"
 *         phone:
 *           type: string
 *           description: User's phone number in international format
 *           example: "+2348012345678"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00.000Z"
 *       description: User entity with core profile information
 * 
 *     GetUserResponse:
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
 *           example: "User retrieved successfully"
 *         data:
 *           type: object
 *           required:
 *             - user
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *       description: Successful user retrieval response
 * 
 *     UserNotFoundResponse:
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
 *           example: "Not Found"
 *         message:
 *           type: string
 *           example: "User not found"
 *       description: Response when requested user does not exist
 */

export {};

