/**
 * Common OpenAPI Schema Definitions
 * 
 * Shared schema components used across multiple endpoints including
 * error responses, success wrappers, and common data formats.
 * 
 * @module docs/schemas/common
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     UUID:
 *       type: string
 *       format: uuid
 *       description: A valid UUID v4 identifier
 *       example: "550e8400-e29b-41d4-a716-446655440000"
 * 
 *     Timestamp:
 *       type: string
 *       format: date-time
 *       description: ISO 8601 timestamp
 *       example: "2024-01-15T10:30:00.000Z"
 * 
 *     ErrorResponse:
 *       type: object
 *       required:
 *         - success
 *         - error
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *           description: Indicates the request was unsuccessful
 *         error:
 *           type: string
 *           description: Error type or category
 *           example: "Validation Error"
 *         message:
 *           type: string
 *           description: Human-readable error message
 *           example: "Invalid request data"
 *         details:
 *           type: array
 *           description: Additional error details (optional)
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 description: Field name that caused the error
 *                 example: "email"
 *               message:
 *                 type: string
 *                 description: Specific field error message
 *                 example: "Invalid email format"
 * 
 *     ValidationErrorResponse:
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
 *           example: "Validation Error"
 *         message:
 *           type: string
 *           example: "Invalid request data"
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: "amount"
 *               message:
 *                 type: string
 *                 example: "Amount must be positive"
 * 
 *     UnauthorizedResponse:
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
 *           example: "Unauthorized"
 *         message:
 *           type: string
 *           example: "Invalid or missing authentication token"
 * 
 *     NotFoundResponse:
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
 * 
 *     ForbiddenResponse:
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
 *           example: "You do not have permission to access this resource"
 * 
 *     InternalServerErrorResponse:
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
 *           example: "Internal Server Error"
 *         message:
 *           type: string
 *           example: "An unexpected error occurred"
 * 
 *     SuccessResponse:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *           description: Indicates the request was successful
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Operation completed successfully"
 *         data:
 *           type: object
 *           description: Response data payload
 */

export {};

