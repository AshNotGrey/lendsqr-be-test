/**
 * Wallet Routes
 * 
 * Handles wallet operations (fund, withdraw, transfer, balance).
 * 
 * @module routes/wallets
 */

import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validator";
import {
  fundWalletSchema,
  withdrawWalletSchema,
  transferSchema,
  getBalanceSchema,
} from "../utils/validation";

const router = Router();

/**
 * POST /api/v1/wallets/:userId/fund
 * Fund a wallet
 * 
 * Path parameters:
 * - userId: string (required, valid UUID)
 * 
 * Request body:
 * - amount: number (required, positive)
 * - reference: string (required, 1-80 chars, unique)
 * - metadata?: object (optional)
 * 
 * Requires authentication
 */
router.post(
  "/:userId/fund",
  authMiddleware,
  validateRequest(fundWalletSchema),
  WalletController.fund
);

/**
 * POST /api/v1/wallets/:userId/withdraw
 * Withdraw from a wallet
 * 
 * Path parameters:
 * - userId: string (required, valid UUID)
 * 
 * Request body:
 * - amount: number (required, positive)
 * - reference: string (required, 1-80 chars, unique)
 * - metadata?: object (optional)
 * 
 * Requires authentication
 */
router.post(
  "/:userId/withdraw",
  authMiddleware,
  validateRequest(withdrawWalletSchema),
  WalletController.withdraw
);

/**
 * POST /api/v1/wallets/transfer
 * Transfer between wallets
 * 
 * Request body:
 * - fromUserId: string (required, valid UUID)
 * - toUserId: string (required, valid UUID, must be different from fromUserId)
 * - amount: number (required, positive)
 * - reference: string (required, 1-80 chars, unique)
 * - metadata?: object (optional)
 * 
 * Requires authentication
 */
router.post(
  "/transfer",
  authMiddleware,
  validateRequest(transferSchema),
  WalletController.transfer
);

/**
 * GET /api/v1/wallets/:userId/balance
 * Get wallet balance
 * 
 * Path parameters:
 * - userId: string (required, valid UUID)
 * 
 * Requires authentication
 */
router.get(
  "/:userId/balance",
  authMiddleware,
  validateRequest(getBalanceSchema),
  WalletController.getBalance
);

export default router;

