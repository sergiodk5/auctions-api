import { injectable } from "inversify";
import { DATABASE_URL } from "@/config/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export interface IDatabaseService {
    db: ReturnType<typeof drizzle>;
}

@injectable()
export default class DatabaseService implements IDatabaseService {
    public readonly db: ReturnType<typeof drizzle>;

    constructor() {
        if (process.env.NODE_ENV === "test") {
            // stub out real connections in tests
            this.db = {} as ReturnType<typeof drizzle>;
        } else {
            const pool = new Pool({ connectionString: DATABASE_URL });
            pool.on("error", (err: unknown) => {
                console.error("PostgreSQL Pool Error", err);
            });
            pool.connect().catch((err: unknown) => {
                console.error("PostgreSQL Pool Connection Error", err);
            });
            pool.on("connect", () => {
                console.log("PostgreSQL Pool Connected");
            });
            this.db = drizzle(pool);
        }
    }
}
