/**
 * Database Migration Runner
 * 
 * Executes all SQL migration files in order from the migrations directory.
 * Usage: node src/utils/migrate.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
    const migrationsDir = path.resolve(__dirname, '../../database/migrations');

    if (!fs.existsSync(migrationsDir)) {
        // Try the shared migrations directory
        const sharedDir = path.resolve(__dirname, '../../../database/migrations');
        if (!fs.existsSync(sharedDir)) {
            console.error('[MIGRATE] Migrations directory not found.');
            process.exit(1);
        }
        return runFromDir(sharedDir);
    }

    return runFromDir(migrationsDir);
}

async function runFromDir(dir) {
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    console.log(`[MIGRATE] Found ${files.length} migration files in ${dir}`);
    console.log('─'.repeat(60));

    const client = await pool.connect();

    try {
        for (const file of files) {
            const filePath = path.join(dir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            console.log(`[MIGRATE] Running: ${file}...`);
            const start = Date.now();

            try {
                await client.query(sql);
                console.log(`[MIGRATE] ✓ ${file} (${Date.now() - start}ms)`);
            } catch (err) {
                console.error(`[MIGRATE] ✗ ${file} — ${err.message}`);
                throw err;
            }
        }

        console.log('─'.repeat(60));
        console.log(`[MIGRATE] All ${files.length} migrations completed successfully.`);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations().catch((err) => {
    console.error('[MIGRATE] Migration failed:', err.message);
    process.exit(1);
});
