/**
 * Database Module
 * 
 * This module provides the core database connection and utility functions
 * for interacting with the MySQL database using Knex.js.
 * 
 * @module db
 */

import knexLib, { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env";
import knexConfig from "../../knexfile";

/**
 * Get the appropriate Knex configuration for the current environment
 */
const environment = config.nodeEnv;
const dbConfig = knexConfig[environment];

if (!dbConfig) {
  throw new Error(
    `No database configuration found for environment: ${environment}`
  );
}

/**
 * Knex instance for database operations
 * 
 * This is the main database connection that should be used throughout
 * the application for all database queries.
 * 
 * @example
 * ```typescript
 * import { knex } from '@db';
 * 
 * const users = await knex('users').select('*');
 * ```
 */
export const knex: Knex = knexLib(dbConfig);

/**
 * Generate a new UUID v4 for use as a primary key
 * 
 * @returns A new UUID string in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * 
 * @example
 * ```typescript
 * import { newId } from '@db';
 * 
 * const userId = newId();
 * ```
 */
export function newId(): string {
  return uuidv4();
}

/**
 * Execute a function within a database transaction
 * 
 * This wrapper ensures proper transaction handling with automatic
 * commit on success and rollback on error. All database operations
 * that modify data should use this function.
 * 
 * @param fn - Async function that receives a transaction object
 * @returns Promise that resolves to the function's return value
 * @throws Propagates any error thrown by the function (after rollback)
 * 
 * @example
 * ```typescript
 * import { withTransaction } from '@db';
 * 
 * await withTransaction(async (trx) => {
 *   await trx('users').insert({ id: newId(), name: 'John' });
 *   await trx('wallets').insert({ id: newId(), user_id: userId });
 *   // Both inserts committed together or rolled back on error
 * });
 * ```
 */
export async function withTransaction<T>(
  fn: (trx: Knex.Transaction) => Promise<T>
): Promise<T> {
  return knex.transaction(async (trx) => {
    try {
      const result = await fn(trx);
      return result;
    } catch (error) {
      // Transaction will be automatically rolled back
      throw error;
    }
  });
}

/**
 * Test the database connection
 * 
 * This function attempts to query the database to verify connectivity.
 * Useful for health checks and startup validation.
 * 
 * @returns Promise that resolves to true if connection is successful
 * @throws Error if connection fails
 */
export async function testConnection(): Promise<boolean> {
  try {
    await knex.raw("SELECT 1");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw new Error(
      `Failed to connect to database: ${(error as Error).message}`
    );
  }
}

/**
 * Close all database connections
 * 
 * This should be called during graceful shutdown to ensure all
 * connections are properly closed.
 * 
 * @returns Promise that resolves when all connections are closed
 */
export async function closeConnection(): Promise<void> {
  try {
    await knex.destroy();
    console.log("✅ Database connections closed");
  } catch (error) {
    console.error("❌ Error closing database connections:", error);
    throw error;
  }
}

/**
 * Initialize database connection and run migrations
 * 
 * This function should be called during application startup to ensure
 * the database is ready and up to date.
 * 
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Test connection
    await testConnection();
    console.log("✅ Database connection successful");

    // Run migrations in production
    if (config.nodeEnv === "production") {
      console.log("🔄 Running database migrations...");
      await knex.migrate.latest();
      console.log("✅ Database migrations complete");
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// Log database initialization in development
if (config.nodeEnv === "development") {
  console.log("📊 Database module loaded");
  console.log(`   Environment: ${environment}`);
}

