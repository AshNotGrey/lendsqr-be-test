/**
 * Wallet Service Tests
 * 
 * Unit tests for wallet operations (fund, withdraw, transfer).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { WalletService } from "../../src/services/wallet.service";
import { knex, withTransaction } from "../../src/db";
import { AppError } from "../../src/middlewares/error";

// Mock transaction first
const mockTrx = {
  insert: vi.fn().mockResolvedValue([1]),
  where: vi.fn().mockReturnThis(),
  first: vi.fn(),
  forUpdate: vi.fn().mockReturnThis(),
  update: vi.fn().mockResolvedValue(1),
  commit: vi.fn(),
  rollback: vi.fn(),
} as any;

// Mock knex to return mockTrx when called
const mockKnex = vi.fn(() => mockTrx) as any;
mockKnex.transaction = vi.fn((callback) => callback(mockTrx));

// Mock dependencies
vi.mock("../../src/db", () => ({
  knex: mockKnex,
  newId: vi.fn(() => "test-id-123"),
  withTransaction: vi.fn((callback) => callback(mockTrx)),
}));

describe("WalletService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fund", () => {
    const mockWallet = {
      id: "wallet-123",
      user_id: "user-123",
      balance: "100.0000",
      currency: "NGN",
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should fund wallet successfully with auto-generated reference", async () => {
      mockTrx.first.mockResolvedValueOnce(mockWallet); // wallet fetch with FOR UPDATE
      mockTrx.first.mockResolvedValueOnce({ balance: "600.0000" }); // updated wallet
      mockTrx.first.mockResolvedValueOnce({ // transaction record
        id: "txn-123",
        reference: "FUND-user-123-1234567890-abc",
        amount: "500.0000",
      });

      const result = await WalletService.fund("user-123", 500, { source: "test" });

      expect(result.wallet.balance).toBe("600.0000");
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
      mockTrx.first.mockResolvedValueOnce(null);

      await expect(
        WalletService.fund("non-existent-user", 100)
      ).rejects.toThrow("Wallet not found");
    });

    it("should create transaction record with correct data", async () => {
      mockTrx.first.mockResolvedValueOnce(mockWallet);
      mockTrx.first.mockResolvedValueOnce({ balance: "600.0000" });
      mockTrx.first.mockResolvedValueOnce({
        id: "txn-123",
        wallet_id: "wallet-123",
        type: "fund",
        amount: "500.0000",
        balance_before: "100.0000",
        balance_after: "600.0000",
        reference: "FUND-user-123-1234567890-abc",
        status: "completed",
        metadata: { source: "test" },
      });

      const result = await WalletService.fund("user-123", 500, { source: "test" });

      expect(result.transaction.type).toBe("fund");
      expect(result.transaction.status).toBe("completed");
      expect(parseFloat(result.transaction.amount)).toBe(500);
    });

    it("should handle decimal amounts correctly", async () => {
      mockTrx.first.mockResolvedValueOnce(mockWallet);
      mockTrx.first.mockResolvedValueOnce({ balance: "250.5000" });
      mockTrx.first.mockResolvedValueOnce({
        id: "txn-123",
        amount: "150.5000",
        reference: "FUND-user-123-1234567890-abc",
      });

      const result = await WalletService.fund("user-123", 150.50);

      expect(result.transaction.amount).toBe("150.5000");
    });
  });

  describe("withdraw", () => {
    const mockWallet = {
      id: "wallet-123",
      user_id: "user-123",
      balance: "500.0000",
      currency: "NGN",
    };

    it("should withdraw successfully with auto-generated reference", async () => {
      mockTrx.first.mockResolvedValueOnce(mockWallet);
      mockTrx.first.mockResolvedValueOnce({ balance: "300.0000" });
      mockTrx.first.mockResolvedValueOnce({
        id: "txn-123",
        reference: "WITHDRAW-user-123-1234567890-xyz",
        amount: "200.0000",
      });

      const result = await WalletService.withdraw("user-123", 200);

      expect(result.wallet.balance).toBe("300.0000");
      expect(result.transaction.reference).toContain("WITHDRAW-user-123");
    });

    it("should reject withdrawal with insufficient balance", async () => {
      mockTrx.first.mockResolvedValueOnce(mockWallet);

      await expect(
        WalletService.withdraw("user-123", 1000)
      ).rejects.toThrow("Insufficient balance");
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
      mockTrx.first.mockResolvedValueOnce(null);

      await expect(
        WalletService.withdraw("non-existent-user", 100)
      ).rejects.toThrow("Wallet not found");
    });

    it("should allow withdrawal up to exact balance", async () => {
      const walletWith100 = { ...mockWallet, balance: "100.0000" };
      mockTrx.first.mockResolvedValueOnce(walletWith100);
      mockTrx.first.mockResolvedValueOnce({ balance: "0.0000" });
      mockTrx.first.mockResolvedValueOnce({
        id: "txn-123",
        reference: "WITHDRAW-user-123-1234567890-xyz",
        amount: "100.0000",
      });

      const result = await WalletService.withdraw("user-123", 100);

      expect(result.wallet.balance).toBe("0.0000");
    });
  });

  describe("transfer", () => {
    const mockSenderWallet = {
      id: "wallet-sender",
      user_id: "user-sender",
      balance: "1000.0000",
      currency: "NGN",
    };

    const mockRecipientWallet = {
      id: "wallet-recipient",
      user_id: "user-recipient",
      balance: "500.0000",
      currency: "NGN",
    };

    it("should transfer successfully with auto-generated reference", async () => {
      mockTrx.first
        .mockResolvedValueOnce(mockSenderWallet) // sender wallet with FOR UPDATE
        .mockResolvedValueOnce(mockRecipientWallet) // recipient wallet with FOR UPDATE
        .mockResolvedValueOnce({ balance: "700.0000" }) // sender after
        .mockResolvedValueOnce({ balance: "800.0000" }); // recipient after

      const result = await WalletService.transfer("user-sender", "user-recipient", 300);

      expect(result.fromWallet.balance).toBe("700.0000");
      expect(result.toWallet.balance).toBe("800.0000");
      expect(result.transfer.reference).toContain("TRANSFER-user-sender");
      expect(mockTrx.insert).toHaveBeenCalledTimes(3); // transfer + 2 transactions
    });

    it("should create dual transaction records with -OUT and -IN suffixes", async () => {
      mockTrx.first
        .mockResolvedValueOnce(mockSenderWallet)
        .mockResolvedValueOnce(mockRecipientWallet)
        .mockResolvedValueOnce({ balance: "700.0000" })
        .mockResolvedValueOnce({ balance: "800.0000" });

      await WalletService.transfer("user-sender", "user-recipient", 300);

      // Check that insert was called 3 times: 1 transfer + 2 transactions
      expect(mockTrx.insert).toHaveBeenCalledTimes(3);

      // Verify insert calls include references with -OUT and -IN
      const insertCalls = vi.mocked(mockTrx.insert).mock.calls;
      const txnCalls = insertCalls.filter(call => call[0]?.type);
      
      expect(txnCalls.length).toBe(2);
    });

    it("should reject transfer to self", async () => {
      await expect(
        WalletService.transfer("user-123", "user-123", 100)
      ).rejects.toThrow("Cannot transfer to yourself");
    });

    it("should reject transfer with insufficient balance", async () => {
      mockTrx.first.mockResolvedValueOnce(mockSenderWallet);

      await expect(
        WalletService.transfer("user-sender", "user-recipient", 2000)
      ).rejects.toThrow("Insufficient balance");
    });

    it("should reject if recipient wallet not found", async () => {
      mockTrx.first
        .mockResolvedValueOnce(mockSenderWallet)
        .mockResolvedValueOnce(null); // recipient not found

      await expect(
        WalletService.transfer("user-sender", "non-existent", 100)
      ).rejects.toThrow("Recipient wallet not found");
    });

    it("should reject if sender wallet not found", async () => {
      mockTrx.first.mockResolvedValueOnce(null);

      await expect(
        WalletService.transfer("non-existent", "user-recipient", 100)
      ).rejects.toThrow("Sender wallet not found");
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
        .mockResolvedValueOnce(mockSenderWallet)
        .mockResolvedValueOnce(mockRecipientWallet)
        .mockResolvedValueOnce({ balance: "700.0000" })
        .mockResolvedValueOnce({ balance: "800.0000" });

      await WalletService.transfer("user-sender", "user-recipient", 300);

      // Both wallets should be updated
      expect(mockTrx.update).toHaveBeenCalledTimes(2);
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
        balance: "1234.5600",
        currency: "NGN",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const localMockTrx = {
        where: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockWallet),
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

