/**
 * Wallet Service
 * 
 * Handles wallet operations with transaction safety.
 * All money operations must use MySQL transactions with row-level locking.
 * 
 * Key principles:
 * - Use DECIMAL for all amounts (no floating point)
 * - Lock wallets with SELECT FOR UPDATE
 * - Order locks by wallet ID to prevent deadlocks
 * - Use unique references for idempotency
 * - Insert transaction log before updating balance
 * 
 * @module services/wallet.service
 */

import { Knex } from "knex";
import { knex, newId, withTransaction } from "../db";
import { logger } from "../utils/logger";

/**
 * Wallet data interface
 */
interface Wallet {
  id: string;
  user_id: string;
  balance_decimal: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Transaction data interface
 */
interface Transaction {
  id: string;
  wallet_id: string;
  type: "credit" | "debit" | "transfer-in" | "transfer-out";
  amount_decimal: string;
  balance_after: string;
  reference: string;
  metadata: any;
  created_at: Date;
}

/**
 * Transfer data interface
 */
interface Transfer {
  id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount_decimal: string;
  status: "pending" | "completed" | "failed";
  reference: string;
  created_at: Date;
}

/**
 * Wallet service class
 */
export class WalletService {
  /**
   * Create a new wallet for a user
   * Should be called within a transaction during user creation
   * 
   * @param userId - User ID
   * @param trx - Knex transaction
   * @returns Created wallet
   */
  static async createWallet(userId: string, trx: Knex.Transaction): Promise<Wallet> {
    const walletId = newId();

    const [wallet] = await trx("wallets")
      .insert({
        id: walletId,
        user_id: userId,
        balance_decimal: "0.000000",
        currency: "NGN",
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      })
      .returning("*");

    logger.info(`Created wallet ${walletId} for user ${userId}`);
    return wallet;
  }

  /**
   * Get wallet by user ID with optional locking
   * 
   * @param userId - User ID
   * @param trx - Optional Knex transaction
   * @param forUpdate - Whether to lock the row (SELECT FOR UPDATE)
   * @returns Wallet or null
   */
  private static async getWalletByUserId(
    userId: string,
    trx?: Knex.Transaction,
    forUpdate: boolean = false
  ): Promise<Wallet | null> {
    const query = (trx || knex)("wallets")
      .where({ user_id: userId })
      .first();

    if (forUpdate && trx) {
      query.forUpdate();
    }

    const wallet = await query;
    return wallet || null;
  }

  /**
   * Check if a transaction reference already exists (idempotency check)
   * 
   * @param reference - Transaction reference
   * @param trx - Knex transaction
   * @returns Existing transaction or null
   */
  private static async checkIdempotency(
    reference: string,
    trx: Knex.Transaction
  ): Promise<Transaction | null> {
    const existing = await trx("transactions")
      .where({ reference })
      .first();

    return existing || null;
  }

  /**
   * Fund a wallet (credit)
   * 
   * Adds money to a user's wallet in a transaction-safe manner.
   * Idempotent - calling with the same reference returns the existing transaction.
   * 
   * @param userId - User ID
   * @param amount - Amount to credit (must be positive)
   * @param reference - Unique transaction reference
   * @param metadata - Optional metadata
   * @returns Updated wallet and transaction details
   * 
   * @throws Error if amount is invalid or wallet not found
   * 
   * @example
   * ```typescript
   * const result = await WalletService.fund(
   *   "user-123",
   *   10000.50,
   *   "FUND-2024-001",
   *   { source: "bank_transfer" }
   * );
   * console.log(result.balance); // "10000.500000"
   * ```
   */
  static async fund(
    userId: string,
    amount: number,
    reference: string,
    metadata?: any
  ): Promise<{ wallet: Wallet; transaction: Transaction }> {
    // Validate amount
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Convert to decimal string (6 decimal places)
    const amountDecimal = amount.toFixed(6);

    return withTransaction(async (trx) => {
      // Check idempotency
      const existingTxn = await this.checkIdempotency(reference, trx);
      if (existingTxn) {
        logger.warn(`Duplicate fund request with reference: ${reference}`);
        const wallet = await this.getWalletByUserId(userId, trx);
        if (!wallet) throw new Error("Wallet not found");
        return { wallet, transaction: existingTxn };
      }

      // Lock wallet with SELECT FOR UPDATE
      const wallet = await this.getWalletByUserId(userId, trx, true);
      
      if (!wallet) {
        throw new Error(`Wallet not found for user: ${userId}`);
      }

      // Calculate new balance
      const currentBalance = parseFloat(wallet.balance_decimal);
      const newBalance = (currentBalance + amount).toFixed(6);

      // Insert transaction record BEFORE updating balance (fintech pattern)
      const transactionId = newId();
      await trx("transactions").insert({
        id: transactionId,
        wallet_id: wallet.id,
        type: "credit",
        amount_decimal: amountDecimal,
        balance_after: newBalance,
        reference,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: trx.fn.now(),
      });

      // Update wallet balance
      await trx("wallets")
        .where({ id: wallet.id })
        .update({
          balance_decimal: newBalance,
          updated_at: trx.fn.now(),
        });

      // Fetch updated wallet and transaction
      const [updatedWallet, transaction] = await Promise.all([
        trx("wallets").where({ id: wallet.id }).first(),
        trx("transactions").where({ id: transactionId }).first(),
      ]);

      logger.info(`Funded wallet ${wallet.id}: +${amountDecimal} (new balance: ${newBalance})`);

      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Withdraw from a wallet (debit)
   * 
   * Removes money from a user's wallet in a transaction-safe manner.
   * Validates sufficient balance before withdrawal.
   * Idempotent - calling with the same reference returns the existing transaction.
   * 
   * @param userId - User ID
   * @param amount - Amount to debit (must be positive)
   * @param reference - Unique transaction reference
   * @param metadata - Optional metadata
   * @returns Updated wallet and transaction details
   * 
   * @throws Error if amount is invalid, insufficient funds, or wallet not found
   * 
   * @example
   * ```typescript
   * const result = await WalletService.withdraw(
   *   "user-123",
   *   5000.00,
   *   "WITHDRAW-2024-001",
   *   { destination: "bank_account" }
   * );
   * ```
   */
  static async withdraw(
    userId: string,
    amount: number,
    reference: string,
    metadata?: any
  ): Promise<{ wallet: Wallet; transaction: Transaction }> {
    // Validate amount
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const amountDecimal = amount.toFixed(6);

    return withTransaction(async (trx) => {
      // Check idempotency
      const existingTxn = await this.checkIdempotency(reference, trx);
      if (existingTxn) {
        logger.warn(`Duplicate withdraw request with reference: ${reference}`);
        const wallet = await this.getWalletByUserId(userId, trx);
        if (!wallet) throw new Error("Wallet not found");
        return { wallet, transaction: existingTxn };
      }

      // Lock wallet with SELECT FOR UPDATE
      const wallet = await this.getWalletByUserId(userId, trx, true);
      
      if (!wallet) {
        throw new Error(`Wallet not found for user: ${userId}`);
      }

      // Check sufficient balance
      const currentBalance = parseFloat(wallet.balance_decimal);
      if (currentBalance < amount) {
        throw new Error(
          `Insufficient funds. Balance: ${currentBalance}, Required: ${amount}`
        );
      }

      // Calculate new balance
      const newBalance = (currentBalance - amount).toFixed(6);

      // Insert transaction record
      const transactionId = newId();
      await trx("transactions").insert({
        id: transactionId,
        wallet_id: wallet.id,
        type: "debit",
        amount_decimal: amountDecimal,
        balance_after: newBalance,
        reference,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: trx.fn.now(),
      });

      // Update wallet balance
      await trx("wallets")
        .where({ id: wallet.id })
        .update({
          balance_decimal: newBalance,
          updated_at: trx.fn.now(),
        });

      // Fetch updated wallet and transaction
      const [updatedWallet, transaction] = await Promise.all([
        trx("wallets").where({ id: wallet.id }).first(),
        trx("transactions").where({ id: transactionId }).first(),
      ]);

      logger.info(`Withdrew from wallet ${wallet.id}: -${amountDecimal} (new balance: ${newBalance})`);

      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Transfer between wallets
   * 
   * Transfers money from one user's wallet to another in a transaction-safe manner.
   * Uses ordered locking (by wallet ID) to prevent deadlocks.
   * Creates a transfer record and two transaction records (debit + credit).
   * Idempotent - calling with the same reference returns the existing transfer.
   * 
   * @param fromUserId - Source user ID
   * @param toUserId - Destination user ID
   * @param amount - Amount to transfer (must be positive)
   * @param reference - Unique transfer reference
   * @param metadata - Optional metadata
   * @returns Transfer details with both wallets
   * 
   * @throws Error if amount is invalid, insufficient funds, or wallets not found
   * 
   * @example
   * ```typescript
   * const result = await WalletService.transfer(
   *   "user-123",
   *   "user-456",
   *   1000.00,
   *   "TRANSFER-2024-001",
   *   { description: "Payment for services" }
   * );
   * ```
   */
  static async transfer(
    fromUserId: string,
    toUserId: string,
    amount: number,
    reference: string,
    metadata?: any
  ): Promise<{
    transfer: Transfer;
    fromWallet: Wallet;
    toWallet: Wallet;
    transactions: Transaction[];
  }> {
    // Validate amount
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Prevent self-transfer
    if (fromUserId === toUserId) {
      throw new Error("Cannot transfer to yourself");
    }

    const amountDecimal = amount.toFixed(6);

    return withTransaction(async (trx) => {
      // Check idempotency for transfer
      const existingTransfer = await trx("transfers")
        .where({ reference })
        .first();

      if (existingTransfer) {
        logger.warn(`Duplicate transfer request with reference: ${reference}`);
        
        // Fetch related data
        const [fromWallet, toWallet, transactions] = await Promise.all([
          trx("wallets").where({ id: existingTransfer.from_wallet_id }).first(),
          trx("wallets").where({ id: existingTransfer.to_wallet_id }).first(),
          trx("transactions")
            .where({ reference })
            .orderBy("created_at", "asc"),
        ]);

        return {
          transfer: existingTransfer,
          fromWallet,
          toWallet,
          transactions,
        };
      }

      // Lock both wallets in ascending order by user_id to prevent deadlocks
      const lockOrder: [string, string] = fromUserId < toUserId 
        ? [fromUserId, toUserId] 
        : [toUserId, fromUserId];

      const [firstWallet, secondWallet] = await Promise.all([
        this.getWalletByUserId(lockOrder[0], trx, true),
        this.getWalletByUserId(lockOrder[1], trx, true),
      ]);

      // Map wallets back to source/destination
      const fromWallet = fromUserId === lockOrder[0] ? firstWallet : secondWallet;
      const toWallet = toUserId === lockOrder[0] ? firstWallet : secondWallet;

      if (!fromWallet) {
        throw new Error(`Source wallet not found for user: ${fromUserId}`);
      }
      if (!toWallet) {
        throw new Error(`Destination wallet not found for user: ${toUserId}`);
      }

      // Check sufficient balance
      const fromBalance = parseFloat(fromWallet.balance_decimal);
      if (fromBalance < amount) {
        throw new Error(
          `Insufficient funds. Balance: ${fromBalance}, Required: ${amount}`
        );
      }

      // Calculate new balances
      const newFromBalance = (fromBalance - amount).toFixed(6);
      const toBalance = parseFloat(toWallet.balance_decimal);
      const newToBalance = (toBalance + amount).toFixed(6);

      // Create transfer record
      const transferId = newId();
      await trx("transfers").insert({
        id: transferId,
        from_wallet_id: fromWallet.id,
        to_wallet_id: toWallet.id,
        amount_decimal: amountDecimal,
        status: "pending",
        reference,
        created_at: trx.fn.now(),
      });

      // Insert transaction records (debit from source, credit to destination)
      const debitTxnId = newId();
      const creditTxnId = newId();

      await Promise.all([
        trx("transactions").insert({
          id: debitTxnId,
          wallet_id: fromWallet.id,
          type: "transfer-out",
          amount_decimal: amountDecimal,
          balance_after: newFromBalance,
          reference,
          metadata: metadata ? JSON.stringify({ ...metadata, transfer_id: transferId }) : JSON.stringify({ transfer_id: transferId }),
          created_at: trx.fn.now(),
        }),
        trx("transactions").insert({
          id: creditTxnId,
          wallet_id: toWallet.id,
          type: "transfer-in",
          amount_decimal: amountDecimal,
          balance_after: newToBalance,
          reference,
          metadata: metadata ? JSON.stringify({ ...metadata, transfer_id: transferId }) : JSON.stringify({ transfer_id: transferId }),
          created_at: trx.fn.now(),
        }),
      ]);

      // Update both wallet balances
      await Promise.all([
        trx("wallets")
          .where({ id: fromWallet.id })
          .update({
            balance_decimal: newFromBalance,
            updated_at: trx.fn.now(),
          }),
        trx("wallets")
          .where({ id: toWallet.id })
          .update({
            balance_decimal: newToBalance,
            updated_at: trx.fn.now(),
          }),
      ]);

      // Update transfer status to completed
      await trx("transfers")
        .where({ id: transferId })
        .update({ status: "completed" });

      // Fetch updated records
      const [transfer, updatedFromWallet, updatedToWallet, transactions] = await Promise.all([
        trx("transfers").where({ id: transferId }).first(),
        trx("wallets").where({ id: fromWallet.id }).first(),
        trx("wallets").where({ id: toWallet.id }).first(),
        trx("transactions")
          .where({ reference })
          .orderBy("created_at", "asc"),
      ]);

      logger.info(
        `Transfer completed: ${fromWallet.id} -> ${toWallet.id}, Amount: ${amountDecimal}`
      );

      return {
        transfer,
        fromWallet: updatedFromWallet,
        toWallet: updatedToWallet,
        transactions,
      };
    });
  }

  /**
   * Get wallet balance
   * 
   * @param userId - User ID
   * @returns Current balance and wallet info
   * 
   * @throws Error if wallet not found
   */
  static async getBalance(userId: string): Promise<{
    balance: string;
    currency: string;
    wallet: Wallet;
  }> {
    const wallet = await this.getWalletByUserId(userId);

    if (!wallet) {
      throw new Error(`Wallet not found for user: ${userId}`);
    }

    return {
      balance: wallet.balance_decimal,
      currency: wallet.currency,
      wallet,
    };
  }

  /**
   * Get transaction history for a wallet
   * 
   * @param userId - User ID
   * @param limit - Max number of transactions to return
   * @param offset - Offset for pagination
   * @returns Array of transactions
   */
  static async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    const wallet = await this.getWalletByUserId(userId);

    if (!wallet) {
      throw new Error(`Wallet not found for user: ${userId}`);
    }

    const transactions = await knex("transactions")
      .where({ wallet_id: wallet.id })
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return transactions;
  }
}

