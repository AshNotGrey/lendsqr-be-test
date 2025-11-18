/**
 * Validator Middleware Tests
 * 
 * Unit tests for request validation middleware.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../../../src/middlewares/validator";
import { z } from "zod";

describe("validateRequest", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it("should pass valid request data", async () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
        age: z.number(),
      }),
    });

    mockReq.body = {
      name: "John Doe",
      age: 30,
    };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should reject invalid body data", async () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
        age: z.number().positive(),
      }),
    });

    mockReq.body = {
      email: "invalid-email",
      age: -5,
    };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "Validation Error",
      message: "Invalid request data",
      details: expect.arrayContaining([
        expect.objectContaining({
          field: expect.any(String),
          message: expect.any(String),
        }),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should validate params", async () => {
    const schema = z.object({
      params: z.object({
        id: z.string().uuid(),
      }),
    });

    mockReq.params = {
      id: "invalid-uuid",
    };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation Error",
      })
    );
  });

  it("should validate query parameters", async () => {
    const schema = z.object({
      query: z.object({
        page: z.string().regex(/^\d+$/),
        limit: z.string().regex(/^\d+$/),
      }),
    });

    mockReq.query = {
      page: "invalid",
      limit: "10",
    };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should validate multiple fields together", async () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email(),
      }),
      params: z.object({
        userId: z.string().uuid(),
      }),
    });

    mockReq.body = { email: "[email protected]" };
    mockReq.params = { userId: "550e8400-e29b-41d4-a716-446655440000" };
    // Remove query since it's not in schema
    mockReq.query = {};

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should return formatted error details", async () => {
    const schema = z.object({
      body: z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().int().positive(),
      }),
    });

    mockReq.body = {
      name: "AB", // too short
      email: "not-an-email",
      age: "not-a-number",
    };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      })
    );
  });

  it("should handle optional fields correctly", async () => {
    const schema = z.object({
      body: z.object({
        required: z.string(),
        optional: z.string().optional(),
      }),
    });

    mockReq.body = {
      required: "value",
      // optional is not provided
    };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it("should reject when required field is missing", async () => {
    const schema = z.object({
      body: z.object({
        required: z.string(),
      }),
    });

    mockReq.body = {};

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle nested object validation", async () => {
    const schema = z.object({
      body: z.object({
        user: z.object({
          name: z.string(),
          address: z.object({
            city: z.string(),
            zipCode: z.string(),
          }),
        }),
      }),
    });

    mockReq.body = {
      user: {
        name: "John",
        address: {
          city: "New York",
          // zipCode missing
        },
      },
    };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining("zipCode"),
          }),
        ]),
      })
    );
  });
});

