import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { TEST_DATABASE_URL } from "../../src/config/env";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export const setupTestDatabase = () => {
    if (!pool) {
        const connectionString = TEST_DATABASE_URL;
        pool = new Pool({ 
            connectionString,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        db = drizzle(pool);
    }
    return db;
};

export const cleanupTestDatabase = async () => {
    if (!db || !pool) {
        console.warn("Database not initialized, skipping cleanup");
        return;
    }

    try {
        // Check if connection is available
        const client = await pool.connect();
        client.release();

        // Clean up tables in the correct order to avoid foreign key constraints
        await db.execute(sql`TRUNCATE TABLE email_verification RESTART IDENTITY CASCADE`);
        await db.execute(sql`TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE`);
        await db.execute(sql`TRUNCATE TABLE refresh_families RESTART IDENTITY CASCADE`);
        await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
    } catch (error) {
        console.error("Failed to cleanup test database:", error);
        throw new Error(`Database cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const closeTestDatabase = async () => {
    if (pool) {
        try {
            await pool.end();
        } catch (error) {
            console.error("Error closing database pool:", error);
        }
        pool = null;
    }
    if (db) {
        db = null;
    }
};

export const getTestDatabase = () => {
    if (!db) {
        throw new Error("Test database not initialized. Call setupTestDatabase() first.");
    }
    return db;
};
