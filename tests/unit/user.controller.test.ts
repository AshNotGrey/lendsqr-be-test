/**
 * User Controller Tests
 * 
 * Unit tests for user controller endpoints.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { UserController } from "../../src/controllers/user.controller";
import { UserService } from "../../src/services/user.service";
import { AppError } from "../../src/middlewares/error";

// Mock UserService
vi.mock("../../src/services/user.service", () => ({
  UserService: {
    getUserById: vi.fn(),
  },
}));

describe("UserController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      params: {},
      user: undefined,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  describe("getById", () => {
    const mockUser = {
      id: "user-123",
      name: "John Doe",
      email: "[email protected]",
      phone: "+2348012345678",
      status: "active" as const,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should return user details when accessing own profile", async () => {
      mockReq.params = { id: "user-123" };
      mockReq.user = { id: "user-123" };

      vi.mocked(UserService.getUserById).mockResolvedValue(mockUser);

      await UserController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            phone: mockUser.phone,
            status: mockUser.status,
            created_at: mockUser.created_at,
          },
        },
      });
    });

    it("should return 403 when accessing another user's profile", async () => {
      mockReq.params = { id: "user-456" };
      mockReq.user = { id: "user-123" };

      await UserController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Forbidden",
        message: "You can only access your own user details",
      });
    });

    it("should return 400 when user ID is missing", async () => {
      mockReq.params = {};
      mockReq.user = { id: "user-123" };

      await UserController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Validation Error",
        message: "User ID is required",
      });
    });

    it("should handle user not found errors", async () => {
      mockReq.params = { id: "user-123" };
      mockReq.user = { id: "user-123" };

      const error = new Error("User not found");
      vi.mocked(UserService.getUserById).mockRejectedValue(error);

      await UserController.getById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

