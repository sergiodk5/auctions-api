import dotenv from "dotenv";
import { closeTestDatabase, setupTestDatabase } from "../helpers/database.helper";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Global setup for integration tests
beforeAll(async () => {
    try {
        // Initialize database connection
        const db = await Promise.resolve(setupTestDatabase());

        if (!db) {
            throw new Error("Failed to initialize database connection");
        }

        console.log("✅ Test database connection established");
    } catch (error) {
        console.error("❌ Failed to setup test database:", error);

        // Provide helpful error message
        if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
            console.error(`
❌ Database connection refused. Make sure PostgreSQL is running:

Using Docker (recommended):
  npm run test:setup

Using local PostgreSQL:
  brew services start postgresql
  createdb -h localhost -U postgres postgres_test

Then run: npm run test:integration
            `);
        }

        throw error;
    }
}, 30000); // 30 second timeout for database setup

// Global teardown for integration tests
afterAll(async () => {
    try {
        // Close database connections properly
        await closeTestDatabase();
        console.log("✅ Test database connections closed");
    } catch (error) {
        console.warn("⚠️ Warning during test cleanup:", error);
    }
});
