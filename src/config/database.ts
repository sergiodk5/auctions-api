import { DATABASE_URL } from "@/config/env";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === "test") {
    // In test environment, export a stub DB client to avoid real connections
    db = {} as ReturnType<typeof drizzle>;
} else {
    const pool = new pg.Pool({
        connectionString: DATABASE_URL,
    });

    pool.on("error", (err) => {
        console.error("PostgreSQL Pool Error", err);
    });
    pool.connect().catch((err: unknown) => {
        console.error("PostgreSQL Pool Connection Error", err);
    });
    pool.on("connect", () => {
        console.log("PostgreSQL Pool Connected");
    });

    db = drizzle(pool);
}

export { db };
