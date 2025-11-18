/**
 * Wallet Controller Tests
 * 
 * Unit tests for wallet controller endpoints.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { WalletController } from "../../src/controllers/wallet.controller";
import { WalletService } from "../../src/services/wallet.service";

// Mock WalletService
vi.mock("../../src/services/wallet.service", () => ({
  WalletService: {
    fund: vi.fn(),
    withdraw: vi.fn(),
    transfer: vi.fn(),
    getBalance: vi.fn(),
  },
}));

describe("WalletController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      params: {},
      body: {},
      user: { id: "user-123" },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  describe("fund", () => {
    it("should fund wallet successfully (no reference in request)", async () => {
      mockReq.params = { userId: "user-123" };
      mockReq.body = { amount: 500 };

      const mockResult = {
        reference: "FUND-user-123-1234567890-abc",
        wallet: {
          id: "wallet-123",
          balance: "1500.0000",
          balance_decimal: "1500.00",
          currency: "NGN",
        },
        transaction: {
          id: "txn-123",
          type: "fund",
          amount: "500.0000",
          amount_decimal: "500.00",
          balance_after: "1500.0000",
          created_at: new Date(),
        },
      };

      vi.mocked(WalletService.fund).mockResolvedValue(mockResult as any);

      await WalletController.fund(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(WalletService.fund).toHaveBeenCalledWith("user-123", 500, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Wallet funded successfully",
        data: {
          reference: mockResult.reference,
          balance: mockResult.wallet.balance_decimal,
          currency: mockResult.wallet.currency,
          transaction: {
            id: mockResult.transaction.id,
            type: mockResult.transaction.type,
            amount: mockResult.transaction.amount_decimal,
            balance_after: mockResult.transaction.balance_after,
            created_at: mockResult.transaction.created_at,
          },
        },
      });
    });

    it("should return 403 when funding another user's wallet", async () => {
      mockReq.params = { userId: "user-456" };
      mockReq.body = { amount: 500 };
      mockReq.user = { id: "user-123" };

      await WalletController.fund(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Forbidden",
        message: "You can only fund your own wallet",
      });
    });

    it("should pass metadata to service", async () => {
      mockReq.params = { userId: "user-123" };
      mockReq.body = { amount: 500, metadata: { source: "bank" } };

      vi.mocked(WalletService.fund).mockResolvedValue({} as any);

      await WalletController.fund(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(WalletService.fund).toHaveBeenCalledWith("user-123", 500, { source: "bank" });
    });

    it("should handle service errors", async () => {
      mockReq.params = { userId: "user-123" };
      mockReq.body = { amount: -100 };

      const error = new Error("Amount must be positive");
      vi.mocked(WalletService.fund).mockRejectedValue(error);

      await WalletController.fund(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("withdraw", () => {
    it("should withdraw successfully (no reference in request)", async () => {
      mockReq.params = { userId: "user-123" };
      mockReq.body = { amount: 200 };

      const mockResult = {
        reference: "WITHDRAW-user-123-1234567890-xyz",
        wallet: {
          id: "wallet-123",
          balance: "800.0000",
          balance_decimal: "800.00",
          currency: "NGN",
        },
        transaction: {
          id: "txn-456",
          type: "withdraw",
          amount: "200.0000",
          amount_decimal: "200.00",
          balance_after: "800.0000",
          created_at: new Date(),
        },
      };

      vi.mocked(WalletService.withdraw).mockResolvedValue(mockResult as any);

      await WalletController.withdraw(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(WalletService.withdraw).toHaveBeenCalledWith("user-123", 200, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Withdrawal successful",
        data: {
          reference: mockResult.reference,
          balance: mockResult.wallet.balance_decimal,
          currency: mockResult.wallet.currency,
          transaction: {
            id: mockResult.transaction.id,
            type: mockResult.transaction.type,
            amount: mockResult.transaction.amount_decimal,
            balance_after: mockResult.transaction.balance_after,
            created_at: mockResult.transaction.created_at,
          },
        },
      });
    });

    it("should return 403 when withdrawing from another user's wallet", async () => {
      mockReq.params = { userId: "user-456" };
      mockReq.body = { amount: 200 };
      mockReq.user = { id: "user-123" };

      await WalletController.withdraw(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Forbidden",
        message: "You can only withdraw from your own wallet",
      });
    });

    it("should handle insufficient balance errors", async () => {
      mockReq.params = { userId: "user-123" };
      mockReq.body = { amount: 10000 };

      const error = new Error("Insufficient balance");
      vi.mocked(WalletService.withdraw).mockRejectedValue(error);

      await WalletController.withdraw(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("transfer", () => {
    it("should transfer successfully (no reference in request)", async () => {
      mockReq.body = {
        fromUserId: "user-123",
        toUserId: "user-456",
        amount: 300,
      };

      const mockResult = {
        reference: "TRANSFER-user-123-1234567890-def",
        transfer: {
          id: "transfer-123",
          from_wallet_id: "wallet-123",
          to_wallet_id: "wallet-456",
          amount: "300.0000",
          amount_decimal: "300.00",
          status: "completed",
          created_at: new Date(),
        },
        fromWallet: {
          id: "wallet-123",
          balance: "700.0000",
          balance_decimal: "700.00",
        },
        toWallet: {
          id: "wallet-456",
          balance: "1300.0000",
          balance_decimal: "1300.00",
        },
        transactions: [
          {
            id: "txn-out",
            wallet_id: "wallet-123",
            type: "transfer-out",
            amount_decimal: "300.00",
            balance_after: "700.0000",
          },
          {
            id: "txn-in",
            wallet_id: "wallet-456",
            type: "transfer-in",
            amount_decimal: "300.00",
            balance_after: "1300.0000",
          },
        ],
      };

      vi.mocked(WalletService.transfer).mockResolvedValue(mockResult as any);

      await WalletController.transfer(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(WalletService.transfer).toHaveBeenCalledWith("user-123", "user-456", 300, undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Transfer completed successfully",
        data: {
          reference: mockResult.reference,
          transfer: {
            id: mockResult.transfer.id,
            from_wallet_id: mockResult.transfer.from_wallet_id,
            to_wallet_id: mockResult.transfer.to_wallet_id,
            amount: mockResult.transfer.amount_decimal,
            status: mockResult.transfer.status,
            created_at: mockResult.transfer.created_at,
          },
          from_balance: mockResult.fromWallet.balance_decimal,
          to_balance: mockResult.toWallet.balance_decimal,
          transactions: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              wallet_id: expect.any(String),
              type: expect.any(String),
              amount: expect.any(String),
              balance_after: expect.any(String),
            }),
          ]),
        },
      });
    });

    it("should return 403 when transferring from another user's wallet", async () => {
      mockReq.body = {
        fromUserId: "user-456",
        toUserId: "user-789",
        amount: 300,
      };
      mockReq.user = { id: "user-123" };

      await WalletController.transfer(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Forbidden",
        message: "You can only transfer from your own wallet",
      });
    });

    it("should handle transfer to self errors", async () => {
      mockReq.body = {
        fromUserId: "user-123",
        toUserId: "user-123",
        amount: 300,
      };

      const error = new Error("Cannot transfer to yourself");
      vi.mocked(WalletService.transfer).mockRejectedValue(error);

      await WalletController.transfer(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getBalance", () => {
    it("should return wallet balance", async () => {
      mockReq.params = { userId: "user-123" };

      const mockResult = {
        balance: "1234.56",
        currency: "NGN",
        wallet: {
          id: "wallet-123",
          user_id: "user-123",
          balance: "1234.5600",
          created_at: new Date(),
          updated_at: new Date(),
        },
      };

      vi.mocked(WalletService.getBalance).mockResolvedValue(mockResult as any);

      await WalletController.getBalance(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          balance: mockResult.balance,
          currency: mockResult.currency,
          wallet_id: mockResult.wallet.id,
        },
      });
    });

    it("should handle wallet not found", async () => {
      mockReq.params = { userId: "non-existent" };

      const error = new Error("Wallet not found");
      vi.mocked(WalletService.getBalance).mockRejectedValue(error);

      await WalletController.getBalance(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

