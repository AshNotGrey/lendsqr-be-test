/**
 * Auth Controller Tests
 * 
 * Unit tests for authentication controller endpoints.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { AuthController } from "../../src/controllers/auth.controller";
import { AuthService } from "../../src/services/auth.service";

// Mock AuthService
vi.mock("../../src/services/auth.service", () => ({
  AuthService: {
    createUser: vi.fn(),
    loginUser: vi.fn(),
  },
}));

describe("AuthController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  describe("signup", () => {
    it("should create user and return 201", async () => {
      const mockUser = {
        id: "test-user-id",
        name: "John Doe",
        email: "[email protected]",
        phone: "+2348012345678",
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockToken = "test-token-123";

      mockReq.body = {
        name: "John Doe",
        email: "[email protected]",
        phone: "+2348012345678",
        bvn: "22212345678",
      };

      vi.mocked(AuthService.createUser).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      await AuthController.signup(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "User created successfully",
          data: {
            user: expect.objectContaining({
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              phone: mockUser.phone,
              status: mockUser.status,
            }),
            token: mockToken,
          },
        })
      );
    });

    it("should handle service errors", async () => {
      mockReq.body = {
        name: "John Doe",
        email: "[email protected]",
        phone: "+2348012345678",
        bvn: "12345678901", // blacklisted
      };

      const error = new Error("User is blacklisted");
      vi.mocked(AuthService.createUser).mockRejectedValue(error);

      await AuthController.signup(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("login", () => {
    it("should login user and return 200", async () => {
      const mockUser = {
        id: "test-user-id",
        name: "John Doe",
        email: "[email protected]",
        phone: "+2348012345678",
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockToken = "test-token-456";

      mockReq.body = {
        email: "[email protected]",
        phone: "+2348012345678",
      };

      vi.mocked(AuthService.loginUser).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      await AuthController.login(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Login successful",
          data: {
            user: expect.objectContaining({
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              phone: mockUser.phone,
              status: mockUser.status,
            }),
            token: mockToken,
          },
        })
      );
    });

    it("should handle invalid credentials", async () => {
      mockReq.body = {
        email: "[email protected]",
        phone: "+2348099999999",
      };

      const error = new Error("Invalid credentials");
      vi.mocked(AuthService.loginUser).mockRejectedValue(error);

      await AuthController.login(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

