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
 * @openapi
 * /api/v1/wallets/{userId}/fund:
 *   post:
 *     tags:
 *       - Wallets
 *     summary: Fund a wallet
 *     description: |
 *       Add funds to a user's wallet. Reference is automatically generated for idempotency.
 *       
 *       **Authentication:** Required (Bearer token)
 *       
 *       **Security:**
 *       - User can only fund their own wallet
 *       - Returns 403 Forbidden if attempting to fund another user's wallet
 *       
 *       **Idempotency:**
 *       - Server automatically generates a unique reference
 *       - Reference format: FUND-{userId}-{timestamp}-{random}
 *       - Reference is returned in the response for tracking
 *       
 *       **Transaction Safety:**
 *       - Uses MySQL transactions with row-level locking
 *       - Guarantees consistency in concurrent operations
 *       - Records balance before and after in transaction log
 *     operationId: fundWallet
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User's unique identifier (must match authenticated user)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FundWalletRequest'
 *           examples:
 *             basicFunding:
 *               summary: Basic wallet funding
 *               value:
 *                 amount: 500.00
 *             fundingWithMetadata:
 *               summary: Funding with metadata
 *               value:
 *                 amount: 1000.00
 *                 metadata:
 *                   source: "bank_transfer"
 *                   description: "Salary deposit"
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FundWalletResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *       409:
 *         description: Duplicate reference (idempotency check failed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DuplicateReferenceResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 */
router.post(
  "/:userId/fund",
  authMiddleware,
  validateRequest(fundWalletSchema),
  WalletController.fund
);

/**
 * @openapi
 * /api/v1/wallets/{userId}/withdraw:
 *   post:
 *     tags:
 *       - Wallets
 *     summary: Withdraw from a wallet
 *     description: |
 *       Withdraw funds from a user's wallet. Reference is automatically generated for idempotency.
 *       
 *       **Authentication:** Required (Bearer token)
 *       
 *       **Security:**
 *       - User can only withdraw from their own wallet
 *       - Returns 403 Forbidden if attempting to withdraw from another user's wallet
 *       
 *       **Balance Check:**
 *       - Amount must not exceed current wallet balance
 *       - Returns 400 Bad Request if insufficient balance
 *       
 *       **Idempotency:**
 *       - Server automatically generates a unique reference
 *       - Reference format: WITHDRAW-{userId}-{timestamp}-{random}
 *       - Reference is returned in the response for tracking
 *       
 *       **Transaction Safety:**
 *       - Uses MySQL transactions with row-level locking (`SELECT ... FOR UPDATE`)
 *       - Guarantees consistency in concurrent operations
 *       - Records balance before and after in transaction log
 *     operationId: withdrawWallet
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User's unique identifier (must match authenticated user)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WithdrawWalletRequest'
 *           examples:
 *             basicWithdrawal:
 *               summary: Basic withdrawal
 *               value:
 *                 amount: 200.00
 *             withdrawalWithMetadata:
 *               summary: Withdrawal with metadata
 *               value:
 *                 amount: 500.00
 *                 metadata:
 *                   destination: "bank_account"
 *                   accountNumber: "0123456789"
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WithdrawWalletResponse'
 *       400:
 *         description: Validation error or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/InsufficientBalanceResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *       409:
 *         description: Duplicate reference (idempotency check failed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DuplicateReferenceResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 */
router.post(
  "/:userId/withdraw",
  authMiddleware,
  validateRequest(withdrawWalletSchema),
  WalletController.withdraw
);

/**
 * @openapi
 * /api/v1/wallets/transfer:
 *   post:
 *     tags:
 *       - Wallets
 *     summary: Transfer funds between wallets
 *     description: |
 *       Transfer funds from one user's wallet to another. Reference is automatically generated for idempotency.
 *       
 *       **Authentication:** Required (Bearer token)
 *       
 *       **Security:**
 *       - User can only transfer from their own wallet
 *       - Returns 403 Forbidden if fromUserId doesn't match authenticated user
 *       
 *       **Validation:**
 *       - Sender and recipient must be different users
 *       - Sender must have sufficient balance
 *       - Both wallets must exist
 *       
 *       **Idempotency:**
 *       - Server automatically generates a unique reference
 *       - Reference format: TRANSFER-{fromUserId}-{timestamp}-{random}
 *       - Reference is returned in the response for tracking
 *       
 *       **Transaction Safety:**
 *       - Uses MySQL transactions with row-level locking on BOTH wallets
 *       - Atomic operation: either both wallets are updated or neither
 *       - Creates two transaction records with unique references (REF-OUT, REF-IN)
 *       - Records transfer in `transfers` table
 *       - Guarantees consistency even under high concurrency
 *     operationId: transferFunds
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *           examples:
 *             basicTransfer:
 *               summary: Basic transfer
 *               value:
 *                 fromUserId: "550e8400-e29b-41d4-a716-446655440000"
 *                 toUserId: "770e8400-e29b-41d4-a716-446655440111"
 *                 amount: 300.00
 *             transferWithMetadata:
 *               summary: Transfer with metadata
 *               value:
 *                 fromUserId: "550e8400-e29b-41d4-a716-446655440000"
 *                 toUserId: "770e8400-e29b-41d4-a716-446655440111"
 *                 amount: 500.00
 *                 metadata:
 *                   reason: "payment"
 *                   description: "Invoice #12345"
 *     responses:
 *       200:
 *         description: Transfer completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
 *       400:
 *         description: Validation error, insufficient balance, or same user transfer
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/InsufficientBalanceResponse'
 *             examples:
 *               sameUser:
 *                 summary: Cannot transfer to yourself
 *                 value:
 *                   success: false
 *                   error: "Validation Error"
 *                   message: "Cannot transfer to yourself"
 *               insufficientBalance:
 *                 summary: Insufficient balance
 *                 value:
 *                   success: false
 *                   error: "Bad Request"
 *                   message: "Insufficient wallet balance"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: Sender or recipient wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             examples:
 *               senderNotFound:
 *                 summary: Sender wallet not found
 *                 value:
 *                   success: false
 *                   error: "Not Found"
 *                   message: "Sender wallet not found"
 *               recipientNotFound:
 *                 summary: Recipient wallet not found
 *                 value:
 *                   success: false
 *                   error: "Not Found"
 *                   message: "Recipient wallet not found"
 *       409:
 *         description: Duplicate reference (idempotency check failed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DuplicateReferenceResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 */
router.post(
  "/transfer",
  authMiddleware,
  validateRequest(transferSchema),
  WalletController.transfer
);

/**
 * @openapi
 * /api/v1/wallets/{userId}/balance:
 *   get:
 *     tags:
 *       - Wallets
 *     summary: Get wallet balance
 *     description: |
 *       Retrieve the current balance and details of a user's wallet.
 *       
 *       **Authentication:** Required (Bearer token)
 *       
 *       **Information Returned:**
 *       - Current wallet balance
 *       - Wallet ID and user ID
 *       - Currency (NGN)
 *       - Creation and update timestamps
 *     operationId: getWalletBalance
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User's unique identifier (UUID)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetBalanceResponse'
 *             example:
 *               success: true
 *               message: "Balance retrieved successfully"
 *               data:
 *                 wallet:
 *                   id: "660f9510-f39c-52e5-b827-557766551111"
 *                   userId: "550e8400-e29b-41d4-a716-446655440000"
 *                   balance: "1500.50"
 *                   currency: "NGN"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T12:45:00.000Z"
 *       400:
 *         description: Invalid UUID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               error: "Validation Error"
 *               message: "Invalid request data"
 *               details:
 *                 - field: "userId"
 *                   message: "Invalid UUID format"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedResponse'
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundResponse'
 *             example:
 *               success: false
 *               error: "Not Found"
 *               message: "Wallet not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerErrorResponse'
 */
router.get(
  "/:userId/balance",
  authMiddleware,
  validateRequest(getBalanceSchema),
  WalletController.getBalance
);

export default router;

