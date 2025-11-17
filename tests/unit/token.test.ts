/**
 * Token Utility Tests
 * 
 * Unit tests for token generation and verification.
 */

import { describe, it, expect } from "vitest";
import { generateToken, verifyToken } from "../../src/utils/token";

describe("Token Utility", () => {
  const testUserId = "123e4567-e89b-12d3-a456-426614174000";

  describe("generateToken", () => {
    it("should generate a valid token", () => {
      const token = generateToken(testUserId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token).toContain("candidate:");
      expect(token.split(":")).toHaveLength(4);
    });

    it("should generate different tokens for the same user", () => {
      const token1 = generateToken(testUserId);
      const token2 = generateToken(testUserId);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const token = generateToken(testUserId);
      const payload = verifyToken(token);
      
      expect(payload.userId).toBe(testUserId);
      expect(payload.nonce).toBeDefined();
    });

    it("should reject an invalid token format", () => {
      expect(() => verifyToken("invalid-token")).toThrow("Invalid token format");
    });

    it("should reject a token with invalid prefix", () => {
      const token = `wrong:${testUserId}:nonce:signature`;
      expect(() => verifyToken(token)).toThrow("Invalid token prefix");
    });

    it("should reject a token with invalid signature", () => {
      const token = `candidate:${testUserId}:nonce:invalid-signature`;
      expect(() => verifyToken(token)).toThrow("Invalid token signature");
    });

    it("should reject a token with invalid UUID", () => {
      const token = "candidate:not-a-uuid:nonce:signature";
      expect(() => verifyToken(token)).toThrow("Invalid user ID format");
    });
  });
});

