import { IDatabaseService } from "@/services/database.service";
import { drizzle } from "drizzle-orm/node-postgres";
import { injectable } from "inversify";
import { Pool } from "pg";

/**
 * Test-specific database service that creates its own connection pool
 * optimized for testing environments
 */
@injectable()
export class TestDatabaseService implements IDatabaseService {
    public readonly db: ReturnType<typeof drizzle>;
    private readonly pool: Pool;

    constructor() {
        // Determine the test database URL based on environment
        // In GitHub Actions, use the service container ports
        // Locally, use the docker-compose test ports
        const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
        const testDatabaseUrl = isGitHubActions
            ? (process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres_test")
            : (process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5435/postgres_test");

        console.log(
            `🔧 TestDatabaseService: Connecting to test database: ${testDatabaseUrl.replace(/:[^:]*@/, ":***@")}`,
        );

        this.pool = new Pool({
            connectionString: testDatabaseUrl,
            // Optimized settings for testing
            max: 5, // Fewer connections for tests
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 5000,
        });

        this.pool.on("error", (err: unknown) => {
            console.error("Test PostgreSQL Pool Error", err);
        });

        this.db = drizzle(this.pool);

        console.log("🔧 TestDatabaseService: Successfully initialized");
    }

    /**
     * Close the database connection pool (for cleanup)
     */
    public async close(): Promise<void> {
        await this.pool.end();
    }
}
