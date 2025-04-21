import { DATABASE_URL } from '@/config/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const pool = new pg.Pool({
    connectionString: DATABASE_URL,
});

export const db = drizzle(pool);