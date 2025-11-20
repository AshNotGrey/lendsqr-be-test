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
// Hoisted callable transaction for withTransaction
const { mockTrx } = vi.hoisted(() => {
  const query = {
    insert: vi.fn().mockResolvedValue([1]),
    where: vi.fn().mockReturnThis(),
    first: vi.fn(),
  } as any;
  const fn = vi.fn(() => new Date());
  const trx = vi.fn(() => query) as any;
  trx.fn = { now: () => new Date() };
  return { mockTrx: trx };
});

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
  });

  describe("createUser (signup)", () => {
    const validSignupData = {
      name: "John Doe",
      email: "[email protected]",
      phone: "+2348012345678",
      bvn: "22212345678",
    };

    it("should create user with valid data", async () => {
      // Mock Adjutor checks (clean across BVN, Email, Phone in mock mode)
      vi.mocked(AdjutorService.checkKarma)
        .mockResolvedValueOnce({
          isFlagged: false,
          identity: validSignupData.bvn,
          identityType: "bvn",
          rawResponse: { status: "success", message: "No record found" },
          checkedAt: new Date(),
        })
        .mockResolvedValueOnce({
          isFlagged: false,
          identity: validSignupData.email,
          identityType: "email",
          rawResponse: { status: "success", message: "No record found" },
          checkedAt: new Date(),
        })
        .mockResolvedValueOnce({
          isFlagged: false,
          identity: validSignupData.phone,
          identityType: "phone",
          rawResponse: { status: "success", message: "No record found" },
          checkedAt: new Date(),
        });

      // Mock database queries (non-transactional checks)
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn()
          .mockResolvedValueOnce(null) // email check
          .mockResolvedValueOnce(null), // phone check
        insert: vi.fn().mockResolvedValue([1]),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      // Transactional fetches (created user + created wallet)
      const trxQuery = mockTrx();
      trxQuery.first
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
          balance_decimal: "0.000000",
          currency: "NGN",
        });

      const result = await AuthService.createUser(validSignupData);

      expect(result.user.email).toBe(validSignupData.email);
      expect(result.user.name).toBe(validSignupData.name);
      expect(result.token).toBeDefined();
      expect(AdjutorService.checkKarma).toHaveBeenCalledWith(validSignupData.bvn, "bvn");
      expect(AdjutorService.checkKarma).toHaveBeenCalledWith(validSignupData.email, "email");
      expect(AdjutorService.checkKarma).toHaveBeenCalledWith(validSignupData.phone, "phone");
    });

    it("should reject blacklisted user with 403", async () => {
      // Mock Adjutor BVN check (blacklisted) for all calls
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
        AuthService.createUser(validSignupData)
      ).rejects.toThrow(/blacklisted/i);

      await expect(
        AuthService.createUser(validSignupData)
      ).rejects.toThrow(AppError);
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
        AuthService.createUser(validSignupData)
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

      // Mock existing phone across two sequential knex calls (email then phone)
      const first = vi.fn()
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ phone: validSignupData.phone }); // phone exists
      const builder = { where: vi.fn().mockReturnThis(), first } as any;
      const mockKnexFn = vi.fn(() => builder);

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      await expect(
        AuthService.createUser(validSignupData)
      ).rejects.toThrow("Phone number already registered");
    });

    it("should create wallet automatically during signup", async () => {
      vi.mocked(AdjutorService.checkKarma)
        .mockResolvedValueOnce({
          isFlagged: false,
          identity: validSignupData.bvn,
          identityType: "bvn",
          rawResponse: { status: "success", message: "No record found" },
          checkedAt: new Date(),
        })
        .mockResolvedValueOnce({
          isFlagged: false,
          identity: validSignupData.email,
          identityType: "email",
          rawResponse: { status: "success", message: "No record found" },
          checkedAt: new Date(),
        })
        .mockResolvedValueOnce({
          isFlagged: false,
          identity: validSignupData.phone,
          identityType: "phone",
          rawResponse: { status: "success", message: "No record found" },
          checkedAt: new Date(),
        });

      const mockInsertTrx = mockTrx().insert;
      const builder2 = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
        insert: vi.fn().mockResolvedValue([1]),
      } as any;
      const mockKnexFn2 = vi.fn(() => builder2);

      vi.mocked(knex).mockImplementation(mockKnexFn2 as any);

      const trxQuery2 = mockTrx();
      trxQuery2.first
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
          balance_decimal: "0.000000",
          currency: "NGN",
        });

      await AuthService.createUser(validSignupData);

      // Should have called transaction-insert twice (user + wallet)
      expect(mockInsertTrx).toHaveBeenCalledTimes(2);
    });
  });

  describe("loginUser", () => {
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

      const result = await AuthService.loginUser(validLoginData);

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
        AuthService.loginUser(validLoginData)
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
        AuthService.loginUser(validLoginData)
      ).rejects.toThrow("Account is blocked. Please contact support.");
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
        AuthService.loginUser(validLoginData)
      ).rejects.toThrow("Account is blacklisted and cannot access services.");
    });

    it("should reject login with missing credentials", async () => {
      const mockKnexFn = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }));

      vi.mocked(knex).mockImplementation(mockKnexFn as any);

      // Should throw because no user found (credentials don't match)
      await expect(
        AuthService.loginUser({ email: "", phone: "" })
      ).rejects.toThrow();
    });
  });
});

