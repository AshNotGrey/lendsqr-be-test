#!/usr/bin/env node
/**
 * One-time script to reset the knex_migrations table.
 * Use this if the migration directory is corrupt due to environment mismatches.
 * 
 * WARNING: This will drop and recreate all tables. Only use in development/staging.
 * 
 * Usage: node scripts/reset-migrations.js
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
        console.log('⚠️  This will truncate the knex_migrations table\n');

        // Check if migrations table exists
        const hasTable = await db.schema.hasTable('knex_migrations');

        if (hasTable) {
            console.log('Truncating knex_migrations table...');
            await db('knex_migrations').truncate();
            console.log('✅ Migration history cleared');
        } else {
            console.log('ℹ️  knex_migrations table does not exist yet');
        }

        console.log('\n✅ Reset complete. You can now run migrations fresh.');
        console.log('   Run: npm run migrate\n');
    } catch (error) {
        console.error('❌ Failed to reset migrations:', error.message);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

resetMigrations();

