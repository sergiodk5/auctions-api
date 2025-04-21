import dotenv from "dotenv";
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: '.env' });

export default defineConfig({
    out: './migrations',
    schema: ['./src/db/usersSchema.ts'],
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});