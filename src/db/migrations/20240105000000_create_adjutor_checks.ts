/**
 * Migration: Create Adjutor Checks Table
 * 
 * This migration creates the adjutor_checks table which logs all Adjutor
 * Karma blacklist verification checks. This provides an audit trail of
 * which users were checked and what the results were.
 * 
 * @module migrations/create_adjutor_checks
 */

import { Knex } from "knex";

/**
 * Create the adjutor_checks table
 * 
 * Table structure:
 * - id: UUID primary key
 * - user_id: Foreign key to users table
 * - identity_type: Type of identity checked (bvn, email, phone)
 * - raw_response: Complete API response (JSON)
 * - is_flagged: Boolean indicating if user is blacklisted
 * - checked_at: Timestamp when check was performed
 * 
 * Note: BVN itself is NOT stored, only the check result
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("adjutor_checks", (table) => {
    // Primary key - UUID format
    table
      .char("id", 36)
      .primary()
      .notNullable()
      .comment("Check record unique identifier");

    // Foreign key to users
    table
      .char("user_id", 36)
      .notNullable()
      .comment("User ID this check belongs to");
    table
      .foreign("user_id")
      .references("users.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    // Identity type that was checked
    table
      .enum("identity_type", ["bvn", "email", "phone"], {
        useNative: true,
        enumName: "identity_type_enum",
      })
      .notNullable()
      .comment("Type of identity that was checked");

    // Complete API response (for audit trail)
    table
      .json("raw_response")
      .notNullable()
      .comment("Complete Adjutor API response");

    // Flag indicating if user is blacklisted
    table
      .boolean("is_flagged")
      .notNullable()
      .comment("True if user is blacklisted, false if clean");

    // Timestamp when check was performed
    table
      .timestamp("checked_at")
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment("Timestamp when check was performed");

    // Indexes for performance
    table.index(["user_id"], "idx_adjutor_checks_user_id");
    table.index(["is_flagged"], "idx_adjutor_checks_is_flagged");
    table.index(["identity_type"], "idx_adjutor_checks_identity_type");
    table.index(["checked_at"], "idx_adjutor_checks_checked_at");
  });

  console.log("✅ Created adjutor_checks table");
}

/**
 * Drop the adjutor_checks table
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("adjutor_checks");
  console.log("✅ Dropped adjutor_checks table");
}

