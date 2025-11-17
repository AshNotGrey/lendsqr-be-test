/**
 * Migration: Create Transfers Table
 * 
 * This migration creates the transfers table which provides a high-level view
 * of transfers between wallets. This complements the transactions table by
 * linking the two transaction records (debit from source, credit to destination)
 * that make up a complete transfer.
 * 
 * @module migrations/create_transfers
 */

import { Knex } from "knex";

/**
 * Create the transfers table
 * 
 * Table structure:
 * - id: UUID primary key
 * - from_wallet_id: Source wallet foreign key
 * - to_wallet_id: Destination wallet foreign key
 * - amount_decimal: Transfer amount (DECIMAL for precision)
 * - status: Transfer status (pending, completed, failed)
 * - reference: Unique reference for idempotency
 * - created_at: Timestamp when transfer was initiated
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("transfers", (table) => {
    // Primary key - UUID format
    table
      .string("id", 36)
      .primary()
      .notNullable()
      .comment("Transfer unique identifier");

    // Source wallet foreign key
    table
      .string("from_wallet_id", 36)
      .notNullable()
      .comment("Source wallet ID");
    table
      .foreign("from_wallet_id")
      .references("wallets.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    // Destination wallet foreign key
    table
      .string("to_wallet_id", 36)
      .notNullable()
      .comment("Destination wallet ID");
    table
      .foreign("to_wallet_id")
      .references("wallets.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    // Amount using DECIMAL for financial precision
    table
      .decimal("amount_decimal", 20, 6)
      .notNullable()
      .comment("Transfer amount");

    // Transfer status enum
    table
      .enum("status", ["pending", "completed", "failed"], {
        useNative: true,
        enumName: "transfer_status_enum",
      })
      .notNullable()
      .defaultTo("pending")
      .comment("Transfer status");

    // Unique reference for idempotency
    table
      .string("reference", 80)
      .notNullable()
      .unique()
      .comment("Unique transfer reference (for idempotency)");

    // Timestamp
    table
      .timestamp("created_at")
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment("Timestamp when transfer was created");

    // Indexes for performance
    table.index(["from_wallet_id"], "idx_transfers_from_wallet");
    table.index(["to_wallet_id"], "idx_transfers_to_wallet");
    table.index(["reference"], "idx_transfers_reference");
    table.index(["status"], "idx_transfers_status");
    table.index(["created_at"], "idx_transfers_created_at");
  });

  // Add check constraint to ensure amount is positive
  await knex.raw(`
    ALTER TABLE transfers
    ADD CONSTRAINT chk_transfer_amount_positive
    CHECK (amount_decimal > 0)
  `);

  // Note: Self-transfer prevention (from_wallet_id != to_wallet_id) is handled
  // in application logic because MySQL doesn't allow CHECK constraints on
  // columns that are part of foreign keys with CASCADE referential actions.

  console.log("✅ Created transfers table");
}

/**
 * Drop the transfers table
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("transfers");
  console.log("✅ Dropped transfers table");
}

