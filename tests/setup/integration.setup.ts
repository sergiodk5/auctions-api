import dotenv from "dotenv";
import { closeTestDatabase, setupTestDatabase } from "../helpers/database.helper";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Global setup for integration tests
beforeAll(async () => {
    // Initialize database connection
    const db = await Promise.resolve(setupTestDatabase());

    if (!db) {
        throw new Error("Failed to initialize database connection");
    }
}, 30000); // 30 second timeout for database setup

// Global teardown for integration tests
afterAll(async () => {
    // Close database connections properly
    await closeTestDatabase();
});
