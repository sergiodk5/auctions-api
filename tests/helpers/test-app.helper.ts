import container from "@/di/container";
import { TYPES } from "@/di/types";
import DatabaseService, { IDatabaseService } from "@/services/database.service";
import { drizzle } from "drizzle-orm/node-postgres";
import { injectable } from "inversify";
import { getTestDatabase, setupTestDatabase } from "./database.helper";

/**
 * Test-specific DatabaseService that uses the same connection as test helpers
 */
@injectable()
class TestDatabaseService implements IDatabaseService {
    public readonly db: ReturnType<typeof drizzle>;

    constructor() {
        console.log("🔧 TestDatabaseService: Initializing with test database connection");
        // Initialize the test database connection
        setupTestDatabase();
        // Use the same database connection that tests use
        this.db = getTestDatabase();
        console.log("🔧 TestDatabaseService: Successfully initialized");
    }
}

/**
 * Configure the DI container to use the test database service
 * This ensures the app and tests use the same database connection
 */
export const configureTestApp = () => {
    console.log("🔧 Configuring app to use test database connection");

    // Check if the service is already bound, if so unbind it first
    if (container.isBound(TYPES.IDatabaseService)) {
        console.log("🔧 Unbinding existing database service");
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        container.unbind(TYPES.IDatabaseService);
    }

    // Bind the test database service
    console.log("🔧 Binding test database service");
    container.bind<IDatabaseService>(TYPES.IDatabaseService).to(TestDatabaseService).inSingletonScope();
    console.log("🔧 Test app configuration complete");
};

/**
 * Reset the DI container to use the production database service
 * (for cleanup purposes if needed)
 */
export const resetAppContainer = () => {
    if (container.isBound(TYPES.IDatabaseService)) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        container.unbind(TYPES.IDatabaseService);
    }
    container.bind<IDatabaseService>(TYPES.IDatabaseService).to(DatabaseService).inSingletonScope();
};
