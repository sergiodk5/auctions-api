import { DATABASE_URL } from "@/config/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { injectable } from "inversify";
import { Pool } from "pg";

export interface IDatabaseService {
    db: ReturnType<typeof drizzle>;
}

@injectable()
export default class DatabaseService implements IDatabaseService {
    public readonly db: ReturnType<typeof drizzle>;

    constructor() {
        let connectionString: string;

        if (process.env.NODE_ENV === "test") {
            // Use a test database for integration tests
            connectionString =
                process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres_test";
        } else {
            connectionString = DATABASE_URL;
        }

        const pool = new Pool({ connectionString });
        pool.on("error", (err: unknown) => {
            console.error("PostgreSQL Pool Error", err);
        });

        if (process.env.NODE_ENV !== "test") {
            pool.connect().catch((err: unknown) => {
                console.error("PostgreSQL Pool Connection Error", err);
            });
            pool.on("connect", () => {
                console.log("PostgreSQL Pool Connected");
            });
        }

        this.db = drizzle(pool);
    }
}
