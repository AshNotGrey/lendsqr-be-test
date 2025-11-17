/**
 * Migration: Create Users Table
 * 
 * This migration creates the users table which stores user identity and status information.
 * Note: BVN is NOT stored in this table per requirements. It's only used during signup
 * for Adjutor blacklist verification.
 * 
 * @module migrations/create_users
 */

import { Knex } from "knex";

/**
 * Create the users table
 * 
 * Table structure:
 * - id: UUID primary key
 * - name: User's full name
 * - email: Unique email address
 * - phone: Unique phone number
 * - status: User status (active, blocked, blacklisted)
 * - created_at: Timestamp when user was created
 * - updated_at: Timestamp when user was last updated
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    // Primary key - UUID format
    table.char("id", 36).primary().notNullable().comment("User unique identifier");

    // User information
    table.string("name", 100).notNullable().comment("User full name");
    table
      .string("email", 150)
      .notNullable()
      .unique()
      .comment("User email address (unique)");
    table
      .string("phone", 20)
      .notNullable()
      .unique()
      .comment("User phone number (unique)");

    // User status enum
    table
      .enum("status", ["active", "blocked", "blacklisted"], {
        useNative: true,
        enumName: "user_status_enum",
      })
      .notNullable()
      .defaultTo("active")
      .comment("User account status");

    // Timestamps
    table
      .timestamp("created_at")
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment("Timestamp when user was created");
    table
      .timestamp("updated_at")
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment("Timestamp when user was last updated");

    // Indexes for performance
    table.index(["email"], "idx_users_email");
    table.index(["phone"], "idx_users_phone");
    table.index(["status"], "idx_users_status");
  });

  // Add trigger for automatic updated_at timestamp (MySQL)
  await knex.raw(`
    CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    SET NEW.updated_at = CURRENT_TIMESTAMP
  `);

  console.log("✅ Created users table");
}

/**
 * Drop the users table and related triggers
 */
export async function down(knex: Knex): Promise<void> {
  // Drop trigger first
  await knex.raw("DROP TRIGGER IF EXISTS users_updated_at");
  
  // Drop table
  await knex.schema.dropTableIfExists("users");
  
  console.log("✅ Dropped users table");
}

