import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { TYPES } from "@/di/types";
import type { ILoggerService } from "@/services/logger.service";
import { drizzle } from "drizzle-orm/node-postgres";
import { inject, injectable } from "inversify";
import { Pool } from "pg";

export interface IDatabaseService {
    db: ReturnType<typeof drizzle>;
}

@injectable()
export default class DatabaseService implements IDatabaseService {
    public readonly db: ReturnType<typeof drizzle>;

    constructor(
        @inject(TYPES.ILoggerService)
        private readonly logger: ILoggerService,
    ) {
        let connectionString: string;

        if (NODE_ENV === "test") {
            // Use a test database for integration tests
            connectionString = TEST_DATABASE_URL;
        } else {
            connectionString = DATABASE_URL;
        }

        const pool = new Pool({ connectionString });
        pool.on("error", (err: unknown) => {
            this.logger.error("PostgreSQL Pool Error", { error: err });
        });

        if (NODE_ENV !== "test") {
            pool.connect().catch((err: unknown) => {
                this.logger.error("PostgreSQL Pool Connection Error", { error: err });
            });
            pool.on("connect", () => {
                this.logger.info("PostgreSQL Pool Connected");
            });
        }

        this.db = drizzle(pool);
    }
}
