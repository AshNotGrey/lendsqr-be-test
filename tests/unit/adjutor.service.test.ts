/**
 * Adjutor Service Tests
 * 
 * Unit tests for Adjutor Karma blacklist checking.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { AdjutorService } from "../../src/services/adjutor.service";

describe("AdjutorService", () => {
  describe("checkKarma - Mock Mode", () => {
    it("should return clean result for a normal BVN", async () => {
      const result = await AdjutorService.checkKarma("22212345679", "bvn");
      
      expect(result.isFlagged).toBe(false);
      expect(result.identityType).toBe("bvn");
      expect(result.rawResponse).toBeDefined();
    });

    it("should return flagged result for test blacklisted BVN", async () => {
      // Test BVN that is blacklisted in mock mode
      const result = await AdjutorService.checkKarma("12345678901", "bvn");
      
      expect(result.isFlagged).toBe(true);
      expect(result.identityType).toBe("bvn");
      expect(result.rawResponse.data).toBeDefined();
      expect(result.rawResponse.data?.karma_identity).toBe("12345678901");
    });

    it("should work with email identity type", async () => {
      const result = await AdjutorService.checkKarma("[email protected]", "email");
      
      expect(result.identityType).toBe("email");
      expect(result.rawResponse).toBeDefined();
    });

    it("should work with phone identity type", async () => {
      const result = await AdjutorService.checkKarma("+2347012345678", "phone");
      
      expect(result.identityType).toBe("phone");
      expect(result.rawResponse).toBeDefined();
    });
  });
});

