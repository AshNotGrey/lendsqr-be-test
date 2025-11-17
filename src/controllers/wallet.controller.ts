/**
 * Wallet Controller
 * 
 * Handles wallet-related HTTP requests (fund, withdraw, transfer, balance).
 * 
 * @module controllers/wallet.controller
 */

import { Request, Response, NextFunction } from "express";
import { WalletService } from "../services/wallet.service";

/**
 * Wallet controller class
 */
export class WalletController {
  /**
   * Fund a wallet
   * 
   * POST /api/v1/wallets/:userId/fund
   * 
   * Request body:
   * - amount: number
   * - reference: string
   * - metadata?: object
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async fund(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { amount, reference, metadata } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: "User ID is required",
        });
        return;
      }

      // Fund wallet
      const result = await WalletService.fund(userId, amount, reference, metadata);

      // Return success response
      res.status(200).json({
        success: true,
        message: "Wallet funded successfully",
        data: {
          balance: result.wallet.balance_decimal,
          currency: result.wallet.currency,
          transaction: {
            id: result.transaction.id,
            type: result.transaction.type,
            amount: result.transaction.amount_decimal,
            balance_after: result.transaction.balance_after,
            reference: result.transaction.reference,
            created_at: result.transaction.created_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Withdraw from a wallet
   * 
   * POST /api/v1/wallets/:userId/withdraw
   * 
   * Request body:
   * - amount: number
   * - reference: string
   * - metadata?: object
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async withdraw(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { amount, reference, metadata } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: "User ID is required",
        });
        return;
      }

      // Withdraw from wallet
      const result = await WalletService.withdraw(userId, amount, reference, metadata);

      // Return success response
      res.status(200).json({
        success: true,
        message: "Withdrawal successful",
        data: {
          balance: result.wallet.balance_decimal,
          currency: result.wallet.currency,
          transaction: {
            id: result.transaction.id,
            type: result.transaction.type,
            amount: result.transaction.amount_decimal,
            balance_after: result.transaction.balance_after,
            reference: result.transaction.reference,
            created_at: result.transaction.created_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transfer between wallets
   * 
   * POST /api/v1/wallets/transfer
   * 
   * Request body:
   * - fromUserId: string
   * - toUserId: string
   * - amount: number
   * - reference: string
   * - metadata?: object
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async transfer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fromUserId, toUserId, amount, reference, metadata } = req.body;

      // Execute transfer
      const result = await WalletService.transfer(
        fromUserId,
        toUserId,
        amount,
        reference,
        metadata
      );

      // Return success response
      res.status(200).json({
        success: true,
        message: "Transfer completed successfully",
        data: {
          transfer: {
            id: result.transfer.id,
            from_wallet_id: result.transfer.from_wallet_id,
            to_wallet_id: result.transfer.to_wallet_id,
            amount: result.transfer.amount_decimal,
            status: result.transfer.status,
            reference: result.transfer.reference,
            created_at: result.transfer.created_at,
          },
          from_balance: result.fromWallet.balance_decimal,
          to_balance: result.toWallet.balance_decimal,
          transactions: result.transactions.map(txn => ({
            id: txn.id,
            wallet_id: txn.wallet_id,
            type: txn.type,
            amount: txn.amount_decimal,
            balance_after: txn.balance_after,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance
   * 
   * GET /api/v1/wallets/:userId/balance
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async getBalance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: "User ID is required",
        });
        return;
      }

      // Get balance
      const result = await WalletService.getBalance(userId);

      // Return success response
      res.status(200).json({
        success: true,
        data: {
          balance: result.balance,
          currency: result.currency,
          wallet_id: result.wallet.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

