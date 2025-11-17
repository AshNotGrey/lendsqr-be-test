/**
 * Token Utility
 * 
 * HMAC-based token generation and validation for faux authentication.
 * 
 * @module utils/token
 */

import { createHmac, randomBytes } from "crypto";
import { config } from "../config/env";

/**
 * Token payload interface
 */
export interface TokenPayload {
  userId: string;
  nonce: string;
}

/**
 * Generate an authentication token
 * 
 * Format: candidate:<userId>:<nonce>:<signature>
 * 
 * The token consists of:
 * 1. Prefix "candidate"
 * 2. User UUID
 * 3. Random nonce (16 bytes hex)
 * 4. HMAC-SHA256 signature of the above
 * 
 * @param userId - User UUID
 * @returns Signed token string
 * 
 * @example
 * ```typescript
 * const token = generateToken("123e4567-e89b-12d3-a456-426614174000");
 * // Returns: "candidate:123e4567-e89b-12d3-a456-426614174000:a1b2c3d4...:signature..."
 * ```
 */
export function generateToken(userId: string): string {
  // Generate random nonce (16 bytes = 32 hex characters)
  const nonce = randomBytes(16).toString("hex");
  
  // Create payload: candidate:<userId>:<nonce>
  const payload = `candidate:${userId}:${nonce}`;
  
  // Sign payload with HMAC-SHA256
  const signature = createSignature(payload);
  
  // Return complete token
  return `${payload}:${signature}`;
}

/**
 * Verify and decode an authentication token
 * 
 * Validates the token signature and extracts the user ID.
 * 
 * @param token - Token string to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or signature doesn't match
 * 
 * @example
 * ```typescript
 * const payload = verifyToken(token);
 * console.log(payload.userId); // "123e4567-e89b-12d3-a456-426614174000"
 * ```
 */
export function verifyToken(token: string): TokenPayload {
  // Parse token format: candidate:<userId>:<nonce>:<signature>
  const parts = token.split(":");
  
  // Validate token format
  if (parts.length !== 4) {
    throw new Error("Invalid token format");
  }
  
  const [prefix, userId, nonce, providedSignature] = parts;
  
  // Validate all parts exist
  if (!prefix || !userId || !nonce || !providedSignature) {
    throw new Error("Invalid token format: missing required parts");
  }
  
  // Validate prefix
  if (prefix !== "candidate") {
    throw new Error("Invalid token prefix");
  }
  
  // Validate userId format (basic UUID check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw new Error("Invalid user ID format");
  }
  
  // Recreate payload and signature
  const payload = `candidate:${userId}:${nonce}`;
  const expectedSignature = createSignature(payload);
  
  // Compare signatures (timing-safe comparison)
  if (expectedSignature !== providedSignature) {
    throw new Error("Invalid token signature");
  }
  
  // Return decoded payload
  return {
    userId,
    nonce,
  };
}

/**
 * Create HMAC signature
 * 
 * Uses HMAC-SHA256 to sign data with the configured secret key.
 * 
 * @param data - Data to sign
 * @returns HMAC signature (hex string)
 */
function createSignature(data: string): string {
  return createHmac("sha256", config.hmacSecret)
    .update(data)
    .digest("hex");
}

