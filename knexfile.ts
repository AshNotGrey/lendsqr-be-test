/**
 * Knex Configuration File
 * 
 * This file configures Knex.js for database migrations and connections.
 * It supports both development and production environments with appropriate
 * settings for each.
 * 
 * @module knexfile
 */

import type { Knex } from "knex";
import path from "path";
import { config } from "./src/config/env";

const isCompiled = /(?:^|[\\/])dist$/.test(__dirname);
const ROOT_DIR = isCompiled ? path.resolve(__dirname, "..") : __dirname;
const SRC_DIR = path.join(ROOT_DIR, "src");
const DIST_DIR = path.join(ROOT_DIR, "dist");

/**
 * Knex configuration for different environments
 * 
 * Each environment (development, production, test) has its own configuration
 * with appropriate settings for migrations, seeds, and connection pooling.
 */
const knexConfig: { [key: string]: Knex.Config } = {
  /**
   * Development environment configuration
   * Used for local development with TypeScript migrations
   */
  development: {
    client: "mysql2",
    connection: config.databaseUrl,
    pool: {
      min: 2,
      max: 10,
      // Test connections before using them
      afterCreate: (conn: any, done: any) => {
        conn.query("SELECT 1", (err: any) => {
          if (err) {
            console.error("❌ Database connection test failed:", err.message);
          }
          done(err, conn);
        });
      },
    },
    migrations: {
      tableName: "knex_migrations",
      directory: path.join(SRC_DIR, "db/migrations"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
    seeds: {
      directory: path.join(SRC_DIR, "db/seeds"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
    // Enable debug logging in development
    debug: config.nodeEnv === "development" && config.logLevel === "debug",
  },

  /**
   * Production environment configuration
   * Uses compiled JavaScript from dist directory
   */
  production: {
    client: "mysql2",
    connection: config.databaseUrl,
    pool: {
      min: 2,
      max: 20,
      // Longer idle timeout in production
      idleTimeoutMillis: 30000,
      // Validate connections before using
      afterCreate: (conn: any, done: any) => {
        conn.query("SELECT 1", (err: any) => {
          done(err, conn);
        });
      },
    },
    migrations: {
      tableName: "knex_migrations",
      directory: path.join(DIST_DIR, "db/migrations"),
      extension: "js",
    },
    seeds: {
      directory: path.join(DIST_DIR, "db/seeds"),
      extension: "js",
    },
    // Disable debug logging in production
    debug: false,
  },

  /**
   * Test environment configuration
   * Uses separate test database
   */
  test: {
    client: "mysql2",
    connection: config.databaseUrl,
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: path.join(SRC_DIR, "db/migrations"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
    seeds: {
      directory: path.join(SRC_DIR, "db/seeds"),
      extension: "ts",
      loadExtensions: [".ts"],
    },
    debug: false,
  },
};

/**
 * Export the configuration for the current environment
 * Knex CLI will use this configuration
 */
export default knexConfig;

// Also export individual environment configs for direct access
export const development = knexConfig['development'];
export const production = knexConfig['production'];
export const test = knexConfig['test'];

