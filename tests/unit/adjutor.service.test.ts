/**
 * Adjutor Service Tests
 * 
 * Unit tests for Adjutor Karma blacklist checking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AdjutorService } from "../../src/services/adjutor.service";
import { knex } from "../../src/db";

// Mock the database
vi.mock("../../src/db", () => ({
  knex: vi.fn(() => ({
    insert: vi.fn().mockResolvedValue([1]),
  })),
  newId: vi.fn(() => "test-uuid-123"),
}));

describe("AdjutorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkKarma - Mock Mode", () => {
    it("should return clean result for a normal BVN", async () => {
      const result = await AdjutorService.checkKarma("22212345679", "bvn");
      
      expect(result.isFlagged).toBe(false);
      expect(result.identityType).toBe("bvn");
      expect(result.rawResponse).toBeDefined();
      expect(result.checkedAt).toBeInstanceOf(Date);
    });

    it("should return flagged result for test blacklisted BVN", async () => {
      // Test BVN that is blacklisted in mock mode
      const result = await AdjutorService.checkKarma("12345678901", "bvn");
      
      expect(result.isFlagged).toBe(true);
      expect(result.identityType).toBe("bvn");
      expect(result.rawResponse.data).toBeDefined();
      expect(result.rawResponse.data?.karma_identity).toBe("12345678901");
      expect(result.rawResponse.data?.karma_type.karma).toBe("Loan Default");
    });

    it("should return flagged result for test blacklisted email", async () => {
      const result = await AdjutorService.checkKarma("blacklisted@adjutor.test", "email");
      
      expect(result.isFlagged).toBe(true);
      expect(result.identityType).toBe("email");
      expect(result.rawResponse.data?.karma_identity).toBe("blacklisted@adjutor.test");
    });

    it("should return flagged result for test blacklisted phone", async () => {
      const result = await AdjutorService.checkKarma("+2341234567890", "phone");
      
      expect(result.isFlagged).toBe(true);
      expect(result.identityType).toBe("phone");
      expect(result.rawResponse.data?.karma_identity).toBe("+2341234567890");
    });

    it("should work with email identity type (clean)", async () => {
      // Use a different email that's not in the blacklist
      const result = await AdjutorService.checkKarma("[email protected]", "email");
      
      expect(result.isFlagged).toBe(false);
      expect(result.identityType).toBe("email");
      expect(result.rawResponse).toBeDefined();
    });

    it("should work with phone identity type (clean)", async () => {
      const result = await AdjutorService.checkKarma("+2347012345678", "phone");
      
      expect(result.isFlagged).toBe(false);
      expect(result.identityType).toBe("phone");
      expect(result.rawResponse).toBeDefined();
    });

    it("should include meta information in mock responses", async () => {
      const result = await AdjutorService.checkKarma("22212345679", "bvn");
      
      expect(result.rawResponse.meta).toBeDefined();
      expect(result.rawResponse.meta?.cost).toBeDefined();
      expect(result.rawResponse.meta?.balance).toBeDefined();
    });

    it("should return consistent identity type in response", async () => {
      const bvnResult = await AdjutorService.checkKarma("22212345679", "bvn");
      const emailResult = await AdjutorService.checkKarma("[email protected]", "email");
      const phoneResult = await AdjutorService.checkKarma("+2347012345678", "phone");
      
      expect(bvnResult.identityType).toBe("bvn");
      expect(emailResult.identityType).toBe("email");
      expect(phoneResult.identityType).toBe("phone");
    });
  });

  describe("checkKarma - Error Handling", () => {
    it("should handle empty identity gracefully", async () => {
      // In mock mode, empty string returns clean result (no validation)
      // This is acceptable for mock mode behavior
      const result = await AdjutorService.checkKarma("", "bvn");
      expect(result).toBeDefined();
      expect(result.identityType).toBe("bvn");
    });
  });

  describe("logCheck", () => {
    it("should log karma check to database", async () => {
      const mockInsert = vi.fn().mockResolvedValue([1]);
      const mockKnex = vi.fn(() => ({
        insert: mockInsert,
      })) as any;
      // Provide knex.fn.now() shape
      mockKnex.fn = { now: () => new Date() } as any;
      
      vi.mocked(knex).mockImplementation(mockKnex);
      // Also set knex.fn.now used in service
      (knex as any).fn = { now: () => new Date() };

      const mockResponse = {
        status: "success",
        message: "No record found",
        meta: { cost: 10, balance: 9990 },
      };

      await AdjutorService.logCheck(
        "user-123",
        "bvn",
        mockResponse,
        false
      );

      expect(mockKnex).toHaveBeenCalledWith("adjutor_checks");
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});

