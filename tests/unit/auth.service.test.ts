/**
 * Auth Service Tests
 * 
 * Unit tests for authentication service (signup, login).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../../src/services/auth.service";
import { AdjutorService } from "../../src/services/adjutor.service";
import { knex } from "../../src/db";
import { AppError } from "../../src/middlewares/error";

// Mock dependencies
// Mock transaction first (before any mocks that use it)
const mockTrx = {
  insert: vi.fn().mockResolvedValue([1]),
  where: vi.fn().mockReturnThis(),
  first: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
} as any;

vi.mock("../../src/db", () => ({
  knex: vi.fn(),
  newId: vi.fn(() => "test-user-id"),
  withTransaction: vi.fn((callback) => callback(mockTrx)),
}));

vi.mock("../../src/services/adjutor.service", () => ({
  AdjutorService: {
    checkKarma: vi.fn(),
    logCheck: vi.fn(),
  },
}));

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SKIP_KARMA_CHECK = "false";
  });

  describe("signup", () => {
    const validSignupData = {
      name: "John Doe",
      email: "[email protected]",
      phone: "+2348012345678",
      bvn: "22212345678",
    };

    it("should create user with valid data", async () => {
      // Mock Adjutor check (clean)
      vi.mocked(AdjutorService.checkKarma).mockResolvedValue({
        isFlagged: false,
        identity: validSignupData.bvn,
        identityType: "bvn",
        rawResponse: { status: "success", message: "No record found" },
        checkedAt: new Date(),
      });

      // Mock database queries
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn()
          .mockResolvedValueOnce(null) // email check
          .mockResolvedValueOnce(null) // phone check
          .mockResolvedValueOnce({ // user fetch after insert
            id: "test-user-id",
            name: validSignupData.name,
            email: validSignupData.email,
            phone: validSignupData.phone,
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
          })
          .mockResolvedValueOnce({ // wallet fetch after insert
            id: "test-wallet-id",
            user_id: "test-user-id",
            balance: "0.0000",
            currency: "NGN",
          }),
        insert: vi.fn().mockResolvedValue([1]),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await AuthService.signup(validSignupData);

      expect(result.user.email).toBe(validSignupData.email);
      expect(result.user.name).toBe(validSignupData.name);
      expect(result.token).toBeDefined();
      expect(AdjutorService.checkKarma).toHaveBeenCalledWith(validSignupData.bvn, "bvn");
    });

    it("should reject blacklisted user with 403", async () => {
      // Mock Adjutor check (blacklisted)
      vi.mocked(AdjutorService.checkKarma).mockResolvedValue({
        isFlagged: true,
        identity: validSignupData.bvn,
        identityType: "bvn",
        rawResponse: {
          status: "success",
          message: "Found",
          data: {
            karma_identity: validSignupData.bvn,
            amount_in_contention: "50000",
            reason: "Loan default",
            default_date: "2024-01-01",
            karma_type: { karma: "Loan Default" },
            karma_identity_type: { identity_type: "BVN" },
            reporting_entity: { name: "Test Bank", email: "[email protected]" },
          },
        },
        checkedAt: new Date(),
      });

      await expect(
        AuthService.signup(validSignupData)
      ).rejects.toThrow("User is blacklisted");

      await expect(
        AuthService.signup(validSignupData)
      ).rejects.toThrow(AppError);
    });

    it("should bypass Adjutor check when SKIP_KARMA_CHECK is enabled", async () => {
      process.env.SKIP_KARMA_CHECK = "true";

      // Mock database queries
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn()
          .mockResolvedValueOnce(null) // email check
          .mockResolvedValueOnce(null) // phone check
          .mockResolvedValueOnce({ // user fetch
            id: "test-user-id",
            name: validSignupData.name,
            email: validSignupData.email,
            phone: validSignupData.phone,
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
          })
          .mockResolvedValueOnce({ // wallet fetch
            id: "test-wallet-id",
            user_id: "test-user-id",
            balance: "0.0000",
            currency: "NGN",
          }),
        insert: vi.fn().mockResolvedValue([1]),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await AuthService.signup(validSignupData);

      expect(result.user.email).toBe(validSignupData.email);
      expect(AdjutorService.checkKarma).not.toHaveBeenCalled();
    });

    it("should reject duplicate email with 409", async () => {
      vi.mocked(AdjutorService.checkKarma).mockResolvedValue({
        isFlagged: false,
        identity: validSignupData.bvn,
        identityType: "bvn",
        rawResponse: { status: "success", message: "No record found" },
        checkedAt: new Date(),
      });

      // Mock existing email
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValueOnce({ email: validSignupData.email }),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      await expect(
        AuthService.signup(validSignupData)
      ).rejects.toThrow("Email already registered");
    });

    it("should reject duplicate phone with 409", async () => {
      vi.mocked(AdjutorService.checkKarma).mockResolvedValue({
        isFlagged: false,
        identity: validSignupData.bvn,
        identityType: "bvn",
        rawResponse: { status: "success", message: "No record found" },
        checkedAt: new Date(),
      });

      // Mock existing phone
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn()
          .mockResolvedValueOnce(null) // email check passes
          .mockResolvedValueOnce({ phone: validSignupData.phone }), // phone exists
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      await expect(
        AuthService.signup(validSignupData)
      ).rejects.toThrow("Phone number already registered");
    });

    it("should create wallet automatically during signup", async () => {
      vi.mocked(AdjutorService.checkKarma).mockResolvedValue({
        isFlagged: false,
        identity: validSignupData.bvn,
        identityType: "bvn",
        rawResponse: { status: "success", message: "No record found" },
        checkedAt: new Date(),
      });

      const mockInsert = vi.fn().mockResolvedValue([1]);
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: "test-user-id",
            name: validSignupData.name,
            email: validSignupData.email,
            phone: validSignupData.phone,
            status: "active",
            created_at: new Date(),
            updated_at: new Date(),
          })
          .mockResolvedValueOnce({
            id: "test-wallet-id",
            user_id: "test-user-id",
            balance: "0.0000",
            currency: "NGN",
          }),
        insert: mockInsert,
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      await AuthService.signup(validSignupData);

      // Should have called insert twice (user + wallet)
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });
  });

  describe("login", () => {
    const validLoginData = {
      email: "[email protected]",
      phone: "+2348012345678",
    };

    it("should login user with valid credentials", async () => {
      const mockUser = {
        id: "test-user-id",
        name: "John Doe",
        email: validLoginData.email,
        phone: validLoginData.phone,
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      const result = await AuthService.login(validLoginData);

      expect(result.user.email).toBe(validLoginData.email);
      expect(result.token).toBeDefined();
    });

    it("should reject invalid credentials with 401", async () => {
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      await expect(
        AuthService.login(validLoginData)
      ).rejects.toThrow("Invalid credentials");
    });

    it("should reject blocked user with 403", async () => {
      const mockUser = {
        id: "test-user-id",
        name: "John Doe",
        email: validLoginData.email,
        phone: validLoginData.phone,
        status: "blocked",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      await expect(
        AuthService.login(validLoginData)
      ).rejects.toThrow("User account is blocked");
    });

    it("should reject blacklisted user with 403", async () => {
      const mockUser = {
        id: "test-user-id",
        name: "John Doe",
        email: validLoginData.email,
        phone: validLoginData.phone,
        status: "blacklisted",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockUser),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      await expect(
        AuthService.login(validLoginData)
      ).rejects.toThrow("User account is blacklisted");
    });

    it("should reject login with missing credentials", async () => {
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      // Should throw because no user found (credentials don't match)
      await expect(
        AuthService.login({ email: "", phone: "" })
      ).rejects.toThrow();
    });
  });
});

