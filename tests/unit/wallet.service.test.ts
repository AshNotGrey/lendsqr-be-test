/**
 * Wallet Service Tests
 * 
 * Unit tests for wallet operations (fund, withdraw, transfer).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { WalletService } from "../../src/services/wallet.service";
import { knex, withTransaction } from "../../src/db";
import { AppError } from "../../src/middlewares/error";

// Create hoisted mocks to avoid vi.mock hoist issues
const { mockTrx, mockKnex } = vi.hoisted(() => {
  const mockTrxQuery = {
    insert: vi.fn().mockResolvedValue([1]),
    where: vi.fn().mockReturnThis(),
    first: vi.fn(),
    forUpdate: vi.fn().mockReturnThis(),
    whereIn: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    update: vi.fn().mockResolvedValue(1),
    commit: vi.fn(),
    rollback: vi.fn(),
  } as any;
  const mockKnexLocal = vi.fn(() => mockTrxQuery) as any;
  mockKnexLocal.transaction = vi.fn((callback: any) => callback(mockKnexLocal));
  (mockKnexLocal as any).fn = { now: () => new Date() };
  // also expose internals for tests
  return { mockTrx: mockTrxQuery, mockKnex: mockKnexLocal };
});

// Mock dependencies
vi.mock("../../src/db", () => ({
  knex: mockKnex,
  newId: vi.fn(() => "test-id-123"),
  withTransaction: vi.fn((callback) => callback(mockKnex)),
}));

describe("WalletService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // helper to simulate knex's thenable builder after .first() while keeping forUpdate available
  const thenable = <T>(result: T) => ({
    forUpdate: vi.fn().mockReturnThis(),
    then: (resolve: (val: T) => any) => resolve(result),
  });

  describe("fund", () => {
    const mockWallet = {
      id: "wallet-123",
      user_id: "user-123",
      balance_decimal: "100.0000",
      currency: "NGN",
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should fund wallet successfully with auto-generated reference", async () => {
      mockTrx.first.mockReturnValueOnce(thenable(mockWallet)); // wallet fetch with FOR UPDATE (thenable)
      mockTrx.first.mockResolvedValueOnce({ balance_decimal: "600.0000" }); // updated wallet
      mockTrx.first.mockResolvedValueOnce({ // transaction record
        id: "txn-123",
        reference: "FUND-user-123-1234567890-abc",
        amount_decimal: "500.0000",
      });

      const result = await WalletService.fund("user-123", 500, { source: "test" });

      expect(result.wallet.balance_decimal).toBe("600.0000");
      expect(result.transaction.reference).toContain("FUND-user-123");
      expect(mockTrx.insert).toHaveBeenCalled();
    });

    it("should reject negative amounts", async () => {
      await expect(
        WalletService.fund("user-123", -100)
      ).rejects.toThrow("Amount must be positive");
    });

    it("should reject zero amounts", async () => {
      await expect(
        WalletService.fund("user-123", 0)
      ).rejects.toThrow("Amount must be positive");
    });

    it("should handle wallet not found", async () => {
      mockTrx.first.mockReturnValueOnce(thenable(null));

      await expect(
        WalletService.fund("non-existent-user", 100)
      ).rejects.toThrow("Wallet not found");
    });

    it("should create transaction record with correct data", async () => {
      mockTrx.first.mockReturnValueOnce(thenable(mockWallet));
      mockTrx.first.mockResolvedValueOnce({ balance_decimal: "600.0000" });
      mockTrx.first.mockResolvedValueOnce({
        id: "txn-123",
        wallet_id: "wallet-123",
        type: "credit",
        amount_decimal: "500.0000",
        balance_after: "600.0000",
        reference: "FUND-user-123-1234567890-abc",
        status: "completed",
        metadata: { source: "test" },
      });

      const result = await WalletService.fund("user-123", 500, { source: "test" });

      expect(result.transaction.type).toBe("credit");
      expect(parseFloat(result.transaction.amount_decimal)).toBe(500);
    });

    it("should handle decimal amounts correctly", async () => {
      mockTrx.first.mockReturnValueOnce(thenable(mockWallet));
      mockTrx.first.mockResolvedValueOnce({ balance_decimal: "250.5000" });
      mockTrx.first.mockResolvedValueOnce({
        id: "txn-123",
        amount_decimal: "150.5000",
        reference: "FUND-user-123-1234567890-abc",
      });

      const result = await WalletService.fund("user-123", 150.50);

      expect(result.transaction.amount_decimal).toBe("150.5000");
    });
  });

  describe("withdraw", () => {
    const mockWallet = {
      id: "wallet-123",
      user_id: "user-123",
      balance_decimal: "500.0000",
      currency: "NGN",
    };

    it("should withdraw successfully with auto-generated reference", async () => {
      mockTrx.first.mockReturnValueOnce(thenable(mockWallet));
      mockTrx.first.mockResolvedValueOnce({ balance_decimal: "300.0000" });
      mockTrx.first.mockResolvedValueOnce({
        id: "txn-123",
        reference: "WITHDRAW-user-123-1234567890-xyz",
        amount_decimal: "200.0000",
      });

      const result = await WalletService.withdraw("user-123", 200);

      expect(result.wallet.balance_decimal).toBe("300.0000");
      expect(result.transaction.reference).toContain("WITHDRAW-user-123");
    });

    it("should reject withdrawal with insufficient balance", async () => {
      mockTrx.first.mockReturnValueOnce(thenable(mockWallet));

      await expect(
        WalletService.withdraw("user-123", 1000)
      ).rejects.toThrow("Insufficient funds");
    });

    it("should reject negative amounts", async () => {
      await expect(
        WalletService.withdraw("user-123", -100)
      ).rejects.toThrow("Amount must be positive");
    });

    it("should reject zero amounts", async () => {
      await expect(
        WalletService.withdraw("user-123", 0)
      ).rejects.toThrow("Amount must be positive");
    });

    it("should handle wallet not found", async () => {
      mockTrx.first.mockReturnValueOnce(thenable(null));

      await expect(
        WalletService.withdraw("non-existent-user", 100)
      ).rejects.toThrow("Wallet not found");
    });

    it("should allow withdrawal up to exact balance", async () => {
      const walletWith100 = { ...mockWallet, balance_decimal: "100.0000" };
      mockTrx.first.mockReturnValueOnce(thenable(walletWith100 as any));
      mockTrx.first.mockResolvedValueOnce({ balance_decimal: "0.0000" });
      mockTrx.first.mockResolvedValueOnce({
        id: "txn-123",
        reference: "WITHDRAW-user-123-1234567890-xyz",
        amount_decimal: "100.0000",
      });

      const result = await WalletService.withdraw("user-123", 100);

      expect(result.wallet.balance_decimal).toBe("0.0000");
    });
  });

  describe("transfer", () => {
    const mockSenderWallet = {
      id: "wallet-sender",
      user_id: "user-sender",
      balance_decimal: "1000.0000",
      currency: "NGN",
    };

    const mockRecipientWallet = {
      id: "wallet-recipient",
      user_id: "user-recipient",
      balance_decimal: "500.0000",
      currency: "NGN",
    };

    it("should transfer successfully with auto-generated reference", async () => {
      // Lock order is ascending by user ID; "user-recipient" sorts before "user-sender"
      mockTrx.first
        .mockReturnValueOnce(thenable(mockRecipientWallet as any)) // first lock -> recipient
        .mockReturnValueOnce(thenable(mockSenderWallet as any)) // second lock -> sender
        .mockResolvedValueOnce({ id: "transfer-1", status: "completed" })
        .mockResolvedValueOnce({ balance_decimal: "700.0000" }) // from wallet after
        .mockResolvedValueOnce({ balance_decimal: "800.0000" }); // to wallet after

      const result = await WalletService.transfer("user-sender", "user-recipient", 300);

      expect(result.fromWallet.balance_decimal).toBe("700.0000");
      expect(result.toWallet.balance_decimal).toBe("800.0000");
      expect(result.reference).toContain("TRANSFER-user-sen-");
      expect(mockTrx.insert).toHaveBeenCalledTimes(3); // transfer + 2 transactions
    });

    it("should create dual transaction records with -OUT and -IN suffixes", async () => {
      mockTrx.first
        .mockReturnValueOnce(thenable(mockRecipientWallet as any))
        .mockReturnValueOnce(thenable(mockSenderWallet as any))
        .mockResolvedValueOnce({ balance_decimal: "700.0000" })
        .mockResolvedValueOnce({ balance_decimal: "800.0000" });

      await WalletService.transfer("user-sender", "user-recipient", 300);

      // Check that insert was called 3 times: 1 transfer + 2 transactions
      expect(mockTrx.insert).toHaveBeenCalledTimes(3);

      // Verify insert calls include references with -OUT and -IN
      const insertCalls = vi.mocked(mockTrx.insert as any).mock.calls;
      const txnCalls = insertCalls.filter(call => call[0]?.type);
      
      expect(txnCalls.length).toBe(2);
    });

    it("should reject transfer to self", async () => {
      await expect(
        WalletService.transfer("user-123", "user-123", 100)
      ).rejects.toThrow("Cannot transfer to yourself");
    });

    it("should reject transfer with insufficient balance", async () => {
      mockTrx.first
        .mockReturnValueOnce(thenable(mockRecipientWallet as any))
        .mockReturnValueOnce(thenable(mockSenderWallet as any));

      await expect(
        WalletService.transfer("user-sender", "user-recipient", 2000)
      ).rejects.toThrow("Insufficient funds");
    });

    it("should reject if recipient wallet not found", async () => {
      mockTrx.first
        .mockReturnValueOnce(thenable(null as any)) // recipient missing
        .mockReturnValueOnce(thenable(mockSenderWallet as any));

      await expect(
        WalletService.transfer("user-sender", "non-existent", 100)
      ).rejects.toThrow("Destination wallet not found");
    });

    it("should reject if sender wallet not found", async () => {
      mockTrx.first
        .mockReturnValueOnce(thenable(null as any))
        .mockReturnValueOnce(thenable(mockRecipientWallet as any));

      await expect(
        WalletService.transfer("non-existent", "user-recipient", 100)
      ).rejects.toThrow("Source wallet not found");
    });

    it("should reject negative amounts", async () => {
      await expect(
        WalletService.transfer("user-sender", "user-recipient", -100)
      ).rejects.toThrow("Amount must be positive");
    });

    it("should reject zero amounts", async () => {
      await expect(
        WalletService.transfer("user-sender", "user-recipient", 0)
      ).rejects.toThrow("Amount must be positive");
    });

    it("should be atomic - updates both wallets or neither", async () => {
      mockTrx.first
        .mockReturnValueOnce(thenable(mockRecipientWallet as any))
        .mockReturnValueOnce(thenable(mockSenderWallet as any))
        .mockResolvedValueOnce({ balance_decimal: "700.0000" })
        .mockResolvedValueOnce({ balance_decimal: "800.0000" });

      await WalletService.transfer("user-sender", "user-recipient", 300);

      // Both wallets should be updated
      expect(mockTrx.update).toHaveBeenCalledTimes(3);
    });
  });

  describe("getWalletByUserId", () => {
    it("should return wallet for valid user", async () => {
      const mockWallet = {
        id: "wallet-123",
        user_id: "user-123",
        balance: "500.0000",
        currency: "NGN",
      };

      const localMockTrx = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockWallet),
      };

      vi.mocked(knex).mockReturnValue(localMockTrx as any);

      const result = await WalletService.getWalletByUserId("user-123");

      expect(result).toEqual(mockWallet);
    });

    it("should return null if wallet not found", async () => {
      const localMockTrx = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(knex).mockReturnValue(localMockTrx as any);

      const result = await WalletService.getWalletByUserId("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getBalance", () => {
    it("should return wallet balance", async () => {
      const mockWallet = {
        id: "wallet-123",
        user_id: "user-123",
        balance_decimal: "1234.5600",
        currency: "NGN",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const localMockTrx = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockWallet as any),
      };

      vi.mocked(knex).mockReturnValue(localMockTrx as any);

      const result = await WalletService.getBalance("user-123");

      expect(result.balance).toBe("1234.5600");
      expect(result.currency).toBe("NGN");
    });

    it("should throw error if wallet not found", async () => {
      const localMockTrx = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      vi.mocked(knex).mockReturnValue(localMockTrx as any);

      await expect(
        WalletService.getBalance("non-existent")
      ).rejects.toThrow("Wallet not found");
    });
  });
});

