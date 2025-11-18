/**
 * Auth Middleware Tests
 * 
 * Unit tests for authentication middleware.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../../../src/middlewares/auth";
import * as tokenUtils from "../../../src/utils/token";

// Mock token utilities
vi.mock("../../../src/utils/token");

describe("authMiddleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it("should pass valid Bearer token", async () => {
    mockReq.headers = {
      authorization: "Bearer candidate:user-123:nonce:signature",
    };

    vi.mocked(tokenUtils.verifyToken).mockReturnValue({
      userId: "user-123",
      nonce: "nonce",
    });

    await authMiddleware(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockReq.user).toEqual({ id: "user-123" });
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should return 401 when Authorization header is missing", async () => {
    mockReq.headers = {};

    await authMiddleware(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorized",
      message: "Authorization header is required",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 401 when Bearer format is incorrect", async () => {
    mockReq.headers = {
      authorization: "InvalidFormat token-here",
    };

    await authMiddleware(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorized",
      message: "Authorization header must be in format: Bearer <token>",
    });
  });

  it("should return 401 when token is empty", async () => {
    mockReq.headers = {
      authorization: "Bearer ",
    };

    await authMiddleware(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorized",
      message: "Token is required",
    });
  });

  it("should return 401 when token signature is invalid", async () => {
    mockReq.headers = {
      authorization: "Bearer candidate:user-123:nonce:invalid-signature",
    };

    vi.mocked(tokenUtils.verifyToken).mockImplementation(() => {
      throw new Error("Invalid token signature");
    });

    await authMiddleware(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorized",
      message: "Invalid token signature",
    });
  });

  it("should return 401 when token format is invalid", async () => {
    mockReq.headers = {
      authorization: "Bearer invalid-token",
    };

    vi.mocked(tokenUtils.verifyToken).mockImplementation(() => {
      throw new Error("Invalid token format");
    });

    await authMiddleware(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorized",
      message: "Invalid token format",
    });
  });

  it("should attach user ID to request", async () => {
    mockReq.headers = {
      authorization: "Bearer candidate:user-456:nonce:signature",
    };

    vi.mocked(tokenUtils.verifyToken).mockReturnValue({
      userId: "user-456",
      nonce: "nonce",
    });

    await authMiddleware(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockReq.user?.id).toBe("user-456");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should handle multiple consecutive calls independently", async () => {
    // First call with valid token
    mockReq.headers = {
      authorization: "Bearer candidate:user-111:nonce:sig1",
    };
    vi.mocked(tokenUtils.verifyToken).mockReturnValue({
      userId: "user-111",
      nonce: "nonce",
    });

    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockReq.user?.id).toBe("user-111");

    // Reset mocks
    vi.clearAllMocks();
    mockReq = { headers: {} };

    // Second call with missing header
    await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});

