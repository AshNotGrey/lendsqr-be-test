#!/usr/bin/env node
/**
 * Migration Reset Script
 * 
 * Drops ALL database tables (users, wallets, transactions, knex_migrations)
 * and clears migration history for a complete fresh start.
 * 
 * ⚠️ WARNING: This is DESTRUCTIVE and will DELETE ALL DATA!
 * 
 * Use Cases:
 * - First-time deployment to fresh database
 * - When you need to completely reset the database schema
 * - Resolving migration conflicts in development
 * 
 * Usage: npm run migrate:reset
 * 
 * For normal deployments, use: npm run migrate (incremental)
 */

const knex = require('knex');
const path = require('path');

// Load config from dist/knexfile.js or knexfile.ts
let knexConfig;
const distKnexfile = path.join(__dirname, '..', 'dist', 'knexfile.js');
const tsKnexfile = path.join(__dirname, '..', 'knexfile.ts');

try {
    // Try compiled version first
    const fs = require('fs');
    if (fs.existsSync(distKnexfile)) {
        knexConfig = require(distKnexfile);
        console.log('Using compiled knexfile from dist/');
    } else {
        // Fall back to TypeScript (requires ts-node)
        require('ts-node/register');
        knexConfig = require(tsKnexfile);
        console.log('Using TypeScript knexfile');
    }
} catch (error) {
    console.error('Failed to load knexfile:', error.message);
    process.exit(1);
}

const env = process.env.NODE_ENV || 'production';
const config = knexConfig.default?.[env] || knexConfig[env];

if (!config) {
    console.error(`No configuration found for environment: ${env}`);
    process.exit(1);
}

async function resetMigrations() {
    const db = knex(config);

    try {
        console.log(`\n🔄 Resetting migrations for environment: ${env}`);
        console.log('⚠️  This will DROP ALL TABLES and clear migration history\n');

        // Drop all tables in reverse order (respecting foreign keys)
        // Order matters: child tables (with FKs) must be dropped before parent tables
        const tablesToDrop = [
            'transfers',        // Has FK to wallets
            'transactions',     // Has FK to wallets
            'adjutor_checks',   // Has FK to users
            'wallets',          // Has FK to users
            'users',            // Base table
            'knex_migrations',
            'knex_migrations_lock'
        ];

        for (const table of tablesToDrop) {
            const exists = await db.schema.hasTable(table);
            if (exists) {
                console.log(`Dropping table: ${table}...`);
                await db.schema.dropTable(table);
                console.log(`✅ Dropped ${table}`);
            }
        }

        console.log('\n✅ Reset complete. All tables dropped.');
        console.log('   Run: npm run migrate\n');
    } catch (error) {
        console.error('❌ Failed to reset migrations:', error.message);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

resetMigrations();

