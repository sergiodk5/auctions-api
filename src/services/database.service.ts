import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
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

        if (NODE_ENV === "test") {
            // Use a test database for integration tests
            connectionString = TEST_DATABASE_URL;
        } else {
            connectionString = DATABASE_URL;
        }

        const pool = new Pool({ connectionString });
        pool.on("error", (err: unknown) => {
            console.error("PostgreSQL Pool Error", err);
        });

        if (NODE_ENV !== "test") {
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
