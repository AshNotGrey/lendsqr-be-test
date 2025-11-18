/**
 * User Service Tests
 * 
 * Unit tests for user service methods.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "../../src/services/user.service";
import { knex } from "../../src/db";

// Mock the database
vi.mock("../../src/db", () => ({
  knex: vi.fn(),
}));

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      const mockUser = {
        id: "test-user-id",
        name: "John Doe",
        email: "[email protected]",
        phone: "+2348012345678",
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await UserService.getUserById("test-user-id");

      expect(result).toEqual(mockUser);
      expect(mockKnexFn).toHaveBeenCalledWith("users");
    });

    it("should throw error when user not found", async () => {
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      await expect(
        UserService.getUserById("non-existent-id")
      ).rejects.toThrow("User not found");
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when email exists", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "[email protected]",
        name: "John Doe",
      };

      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await UserService.getUserByEmail("[email protected]");

      expect(result).toEqual(mockUser);
    });

    it("should return null when email does not exist", async () => {
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await UserService.getUserByEmail("[email protected]");

      expect(result).toBeNull();
    });
  });

  describe("getUserByPhone", () => {
    it("should return user when phone exists", async () => {
      const mockUser = {
        id: "test-user-id",
        phone: "+2348012345678",
        name: "John Doe",
      };

      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await UserService.getUserByPhone("+2348012345678");

      expect(result).toEqual(mockUser);
    });

    it("should return null when phone does not exist", async () => {
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await UserService.getUserByPhone("+2348099999999");

      expect(result).toBeNull();
    });
  });

  describe("emailExists", () => {
    it("should return true when email exists", async () => {
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ email: "[email protected]" }),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await UserService.emailExists("[email protected]");

      expect(result).toBe(true);
    });

    it("should return false when email does not exist", async () => {
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await UserService.emailExists("[email protected]");

      expect(result).toBe(false);
    });
  });

  describe("phoneExists", () => {
    it("should return true when phone exists", async () => {
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ phone: "+2348012345678" }),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await UserService.phoneExists("+2348012345678");

      expect(result).toBe(true);
    });

    it("should return false when phone does not exist", async () => {
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await UserService.phoneExists("+2348099999999");

      expect(result).toBe(false);
    });
  });
});

