/**
 * Migration: Create Wallets Table
 * 
 * This migration creates the wallets table which stores wallet balances
 * for each user. Each user has exactly one wallet (one-to-one relationship).
 * 
 * @module migrations/create_wallets
 */

import { Knex } from "knex";

/**
 * Create the wallets table
 * 
 * Table structure:
 * - id: UUID primary key
 * - user_id: Foreign key to users table (unique - one wallet per user)
 * - balance_decimal: Current wallet balance (DECIMAL for precision)
 * - currency: Currency code (default NGN - Nigerian Naira)
 * - created_at: Timestamp when wallet was created
 * - updated_at: Timestamp when wallet was last updated
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wallets", (table) => {
    // Primary key - UUID format
    table.char("id", 36).primary().notNullable().comment("Wallet unique identifier");

    // Foreign key to users (one-to-one relationship)
    table
      .char("user_id", 36)
      .notNullable()
      .unique()
      .comment("User ID (one wallet per user)");
    table
      .foreign("user_id")
      .references("users.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    // Balance using DECIMAL for financial precision
    // DECIMAL(20,6) allows for very large amounts with 6 decimal places
    table
      .decimal("balance_decimal", 20, 6)
      .notNullable()
      .defaultTo(0.0)
      .comment("Wallet balance (DECIMAL for precision)");

    // Currency code
    table
      .string("currency", 10)
      .notNullable()
      .defaultTo("NGN")
      .comment("Currency code (default NGN)");

    // Timestamps
    table
      .timestamp("created_at")
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment("Timestamp when wallet was created");
    table
      .timestamp("updated_at")
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment("Timestamp when wallet was last updated");

    // Indexes for performance
    table.index(["user_id"], "idx_wallets_user_id");
    table.index(["currency"], "idx_wallets_currency");
    table.index(["balance_decimal"], "idx_wallets_balance");
  });

  // Add trigger for automatic updated_at timestamp (MySQL)
  await knex.raw(`
    CREATE TRIGGER wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP
  `);

  // Add check constraint to ensure balance is never negative
  await knex.raw(`
    ALTER TABLE wallets
    ADD CONSTRAINT chk_wallet_balance_positive
    CHECK (balance_decimal >= 0)
  `);

  console.log("✅ Created wallets table");
}

/**
 * Drop the wallets table and related triggers/constraints
 */
export async function down(knex: Knex): Promise<void> {
  // Drop trigger first
  await knex.raw("DROP TRIGGER IF EXISTS wallets_updated_at");
  
  // Drop table (constraints are dropped automatically)
  await knex.schema.dropTableIfExists("wallets");
  
  console.log("✅ Dropped wallets table");
}

