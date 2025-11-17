/**
 * Migration: Create Transactions Table
 * 
 * This migration creates the transactions table which serves as an immutable
 * ledger of all wallet transactions. Every money movement is recorded here.
 * 
 * @module migrations/create_transactions
 */

import { Knex } from "knex";

/**
 * Create the transactions table
 * 
 * Table structure:
 * - id: UUID primary key
 * - wallet_id: Foreign key to wallets table
 * - type: Transaction type (credit, debit, transfer-in, transfer-out)
 * - amount_decimal: Transaction amount (DECIMAL for precision)
 * - balance_after: Wallet balance after this transaction
 * - reference: Unique reference for idempotency
 * - metadata: Optional JSON metadata
 * - created_at: Timestamp when transaction was created
 * 
 * Note: This is an append-only table - no updates or deletes
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("transactions", (table) => {
    // Primary key - UUID format
    table
      .string("id", 36)
      .primary()
      .notNullable()
      .comment("Transaction unique identifier");

    // Foreign key to wallets
    table
      .string("wallet_id", 36)
      .notNullable()
      .comment("Wallet ID this transaction belongs to");
    table
      .foreign("wallet_id")
      .references("wallets.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    // Transaction type enum
    table
      .enum(
        "type",
        ["credit", "debit", "transfer-in", "transfer-out"],
        {
          useNative: true,
          enumName: "transaction_type_enum",
        }
      )
      .notNullable()
      .comment("Transaction type");

    // Amount using DECIMAL for financial precision
    table
      .decimal("amount_decimal", 20, 6)
      .notNullable()
      .comment("Transaction amount (always positive)");

    // Balance after transaction (for audit trail)
    table
      .decimal("balance_after", 20, 6)
      .notNullable()
      .comment("Wallet balance after this transaction");

    // Unique reference for idempotency
    table
      .string("reference", 80)
      .notNullable()
      .unique()
      .comment("Unique transaction reference (for idempotency)");

    // Optional metadata (JSON)
    table
      .json("metadata")
      .nullable()
      .comment("Optional transaction metadata");

    // Timestamp (no updates - append-only)
    table
      .timestamp("created_at")
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment("Timestamp when transaction was created");

    // Indexes for performance
    table.index(["wallet_id"], "idx_transactions_wallet_id");
    table.index(["type"], "idx_transactions_type");
    table.index(["reference"], "idx_transactions_reference");
    table.index(["created_at"], "idx_transactions_created_at");
  });

  // Add check constraint to ensure amount is always positive
  await knex.raw(`
    ALTER TABLE transactions
    ADD CONSTRAINT chk_transaction_amount_positive
    CHECK (amount_decimal > 0)
  `);

  console.log("✅ Created transactions table");
}

/**
 * Drop the transactions table
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("transactions");
  console.log("✅ Dropped transactions table");
}

