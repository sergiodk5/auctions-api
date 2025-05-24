import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { TEST_DATABASE_URL } from "../../src/config/env";

let pool: Pool;
let db: ReturnType<typeof drizzle>;

export const setupTestDatabase = () => {
    const connectionString = TEST_DATABASE_URL;
    pool = new Pool({ connectionString });
    db = drizzle(pool);
    return db;
};

export const cleanupTestDatabase = async () => {
    if (db) {
        // Clean up tables in the correct order to avoid foreign key constraints
        await db.execute(sql`TRUNCATE TABLE email_verification RESTART IDENTITY CASCADE`);
        await db.execute(sql`TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE`);
        await db.execute(sql`TRUNCATE TABLE refresh_families RESTART IDENTITY CASCADE`);
        await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
    }
};

export const closeTestDatabase = async () => {
    if (pool) {
        await pool.end();
    }
};

export const getTestDatabase = () => db;
