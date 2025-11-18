/**
 * Adjutor Controller Tests
 * 
 * Unit tests for Adjutor controller endpoints.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { AdjutorController } from "../../src/controllers/adjutor.controller";
import { AdjutorService } from "../../src/services/adjutor.service";

// Mock AdjutorService
vi.mock("../../src/services/adjutor.service", () => ({
  AdjutorService: {
    checkKarma: vi.fn(),
  },
}));

describe("AdjutorController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      params: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  describe("checkKarma", () => {
    it("should check BVN and return clean result", async () => {
      mockReq.params = {
        identityType: "bvn",
        identity: "22212345678",
      };

      const mockResult = {
        isFlagged: false,
        identityType: "bvn" as const,
        checkedAt: new Date(),
        rawResponse: {
          status: "success",
          message: "No record found",
          meta: { cost: 10, balance: 9990 },
        },
      };

      vi.mocked(AdjutorService.checkKarma).mockResolvedValue(mockResult);

      await AdjutorController.checkKarma(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(AdjutorService.checkKarma).toHaveBeenCalledWith("22212345678", "bvn");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Identity is clean",
        data: {
          is_flagged: false,
          identity_type: "bvn",
          checked_at: mockResult.checkedAt,
          raw_response: mockResult.rawResponse,
        },
      });
    });

    it("should check BVN and return blacklisted result", async () => {
      mockReq.params = {
        identityType: "bvn",
        identity: "12345678901",
      };

      const mockResult = {
        isFlagged: true,
        identityType: "bvn" as const,
        checkedAt: new Date(),
        rawResponse: {
          status: "success",
          message: "Found",
          data: {
            karma_identity: "12345678901",
            amount_in_contention: "50000",
            reason: "Loan default",
            default_date: "2024-01-01",
            karma_type: { karma: "Loan Default" },
            karma_identity_type: { identity_type: "BVN" },
            reporting_entity: { name: "Test Bank", email: "[email protected]" },
          },
        },
      };

      vi.mocked(AdjutorService.checkKarma).mockResolvedValue(mockResult);

      await AdjutorController.checkKarma(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Identity is blacklisted",
        data: {
          is_flagged: true,
          identity_type: "bvn",
          checked_at: mockResult.checkedAt,
          raw_response: mockResult.rawResponse,
        },
      });
    });

    it("should work with email identity type", async () => {
      mockReq.params = {
        identityType: "email",
        identity: "[email protected]",
      };

      const mockResult = {
        isFlagged: false,
        identityType: "email" as const,
        checkedAt: new Date(),
        rawResponse: {
          status: "success",
          message: "No record found",
        },
      };

      vi.mocked(AdjutorService.checkKarma).mockResolvedValue(mockResult);

      await AdjutorController.checkKarma(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(AdjutorService.checkKarma).toHaveBeenCalledWith("[email protected]", "email");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should work with phone identity type", async () => {
      mockReq.params = {
        identityType: "phone",
        identity: "+2348012345678",
      };

      const mockResult = {
        isFlagged: false,
        identityType: "phone" as const,
        checkedAt: new Date(),
        rawResponse: {
          status: "success",
          message: "No record found",
        },
      };

      vi.mocked(AdjutorService.checkKarma).mockResolvedValue(mockResult);

      await AdjutorController.checkKarma(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(AdjutorService.checkKarma).toHaveBeenCalledWith("+2348012345678", "phone");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 when identity is missing", async () => {
      mockReq.params = {
        identityType: "bvn",
      };

      await AdjutorController.checkKarma(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Validation Error",
        message: "Identity and identityType are required",
      });
    });

    it("should handle service errors", async () => {
      mockReq.params = {
        identityType: "bvn",
        identity: "12345678901",
      };

      const error = new Error("Adjutor API error");
      vi.mocked(AdjutorService.checkKarma).mockRejectedValue(error);

      await AdjutorController.checkKarma(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

