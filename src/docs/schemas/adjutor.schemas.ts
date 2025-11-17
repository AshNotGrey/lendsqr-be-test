/**
 * Adjutor OpenAPI Schema Definitions
 * 
 * Schema components for Adjutor Karma blacklist verification endpoints.
 * 
 * @module docs/schemas/adjutor
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     KarmaCheckResponse:
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
 *           example: "Karma check completed"
 *         data:
 *           type: object
 *           required:
 *             - identityType
 *             - identity
 *             - isBlacklisted
 *           properties:
 *             identityType:
 *               type: string
 *               enum: [bvn, email, phone]
 *               description: Type of identity checked
 *               example: "bvn"
 *             identity:
 *               type: string
 *               description: The identity value that was checked
 *               example: "12345678901"
 *             isBlacklisted:
 *               type: boolean
 *               description: Whether the identity is found in the blacklist
 *               example: false
 *             reason:
 *               type: string
 *               nullable: true
 *               description: Reason for blacklisting (if blacklisted)
 *               example: null
 *             karma:
 *               type: object
 *               nullable: true
 *               description: Additional karma information from Adjutor API
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "clear"
 *                 message:
 *                   type: string
 *                   example: "No negative records found"
 *       description: Successful Adjutor Karma blacklist check response
 * 
 *     KarmaBlacklistedResponse:
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
 *           example: "Karma check completed"
 *         data:
 *           type: object
 *           required:
 *             - identityType
 *             - identity
 *             - isBlacklisted
 *           properties:
 *             identityType:
 *               type: string
 *               enum: [bvn, email, phone]
 *               description: Type of identity checked
 *               example: "bvn"
 *             identity:
 *               type: string
 *               description: The identity value that was checked
 *               example: "12345678901"
 *             isBlacklisted:
 *               type: boolean
 *               description: Whether the identity is found in the blacklist
 *               example: true
 *             reason:
 *               type: string
 *               nullable: true
 *               description: Reason for blacklisting
 *               example: "Multiple loan defaults"
 *             karma:
 *               type: object
 *               nullable: true
 *               description: Additional karma information from Adjutor API
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "blacklisted"
 *                 message:
 *                   type: string
 *                   example: "User has negative credit history"
 *       description: Response when identity is found in Adjutor Karma blacklist
 * 
 *     AdjutorApiErrorResponse:
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
 *           example: "Service Unavailable"
 *         message:
 *           type: string
 *           example: "Failed to connect to Adjutor API"
 *         details:
 *           type: object
 *           properties:
 *             reason:
 *               type: string
 *               example: "External service timeout"
 *       description: Response when Adjutor API is unavailable or returns an error
 */

export {};

