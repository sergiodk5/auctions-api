import "reflect-metadata";

// Mock the entire pg module
jest.mock("pg", () => ({
    Pool: jest.fn(),
}));

// Mock drizzle
jest.mock("drizzle-orm/node-postgres", () => ({
    drizzle: jest.fn(),
}));

// Mock environment variables with dynamic control
let mockNodeEnv = "test";
jest.mock("@/config/env", () => ({
    DATABASE_URL: "postgresql://localhost:5432/auction_db",
    TEST_DATABASE_URL: "postgresql://localhost:5432/auction_test_db",
    get NODE_ENV() {
        return mockNodeEnv;
    },
}));

import DatabaseService from "@/services/database.service";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

describe("DatabaseService", () => {
    let mockPool: {
        on: jest.Mock;
        connect: jest.Mock;
    };
    let mockDrizzle: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockNodeEnv = "test"; // Reset to test environment

        // Create mock pool instance
        mockPool = {
            on: jest.fn(),
            connect: jest.fn().mockResolvedValue(undefined),
        };

        // Mock Pool constructor to return our mock pool
        const MockedPool = Pool as jest.MockedClass<typeof Pool>;
        MockedPool.mockImplementation(() => mockPool as unknown as Pool);

        // Mock drizzle function
        mockDrizzle = { query: jest.fn() };
        (drizzle as unknown as jest.Mock).mockReturnValue(mockDrizzle);
    });

    describe("constructor", () => {
        it("should create database service successfully", () => {
            const service = new DatabaseService();

            expect(service.db).toBe(mockDrizzle);
            expect(service).toHaveProperty("db");
        });

        it("should use TEST_DATABASE_URL in test environment", () => {
            mockNodeEnv = "test";
            new DatabaseService();

            expect(Pool).toHaveBeenCalledWith({
                connectionString: "postgresql://localhost:5432/auction_test_db",
            });
        });

        it("should use DATABASE_URL in non-test environment", () => {
            mockNodeEnv = "production";
            new DatabaseService();

            expect(Pool).toHaveBeenCalledWith({
                connectionString: "postgresql://localhost:5432/auction_db",
            });
        });

        it("should setup error handler for pool", () => {
            new DatabaseService();

            expect(mockPool.on).toHaveBeenCalledWith("error", expect.any(Function));
        });

        it("should handle pool errors by logging them", () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            new DatabaseService();

            // Get the error handler function and call it
            const calls = mockPool.on.mock.calls;
            const errorCall = calls.find((call: any) => call[0] === "error");
            expect(errorCall).toBeDefined();

            // Extract error handler - we know it exists from the assertion above
            const errorHandler = errorCall?.[1];
            expect(errorHandler).toBeDefined();

            const testError = new Error("Connection failed");
            if (errorHandler) {
                errorHandler(testError);
            }

            expect(consoleSpy).toHaveBeenCalledWith("PostgreSQL Pool Error", testError);
            consoleSpy.mockRestore();
        });

        it("should call drizzle with the pool", () => {
            new DatabaseService();

            expect(drizzle).toHaveBeenCalledWith(mockPool);
        });

        it("should implement IDatabaseService interface", () => {
            const service = new DatabaseService();

            expect(service).toHaveProperty("db");
            expect(typeof service.db).toBe("object");
        });
    });

    describe("production environment behavior", () => {
        beforeEach(() => {
            // Reset the mock to track calls for production tests
            (Pool as any).mockClear();
            mockPool.on.mockClear();
            mockPool.connect.mockClear();
        });

        it("should setup connection handlers for non-test environments", () => {
            // Set to production environment
            mockNodeEnv = "production";

            // Create a new instance to test production behavior
            const service = new DatabaseService();

            // Should still create the database service
            expect(service.db).toBe(mockDrizzle);

            // Should setup connect event handler
            expect(mockPool.on).toHaveBeenCalledWith("connect", expect.any(Function));

            // Should attempt to connect
            expect(mockPool.connect).toHaveBeenCalled();
        });

        it("should handle connection success logging in production", () => {
            const consoleSpy = jest.spyOn(console, "log").mockImplementation();
            mockNodeEnv = "production";

            const service = new DatabaseService();

            // Find the connect handler and verify it exists
            const calls = mockPool.on.mock.calls;
            const connectCall = calls.find((call: any) => call[0] === "connect");

            expect(connectCall).toBeDefined();

            // Extract and execute the connect handler
            const connectHandler = connectCall?.[1];
            expect(connectHandler).toBeDefined();
            if (connectHandler) {
                connectHandler();
            }

            expect(consoleSpy).toHaveBeenCalledWith("PostgreSQL Pool Connected");
            expect(service.db).toBe(mockDrizzle);

            consoleSpy.mockRestore();
        });

        it("should handle connection errors in production", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            const connectionError = new Error("Failed to connect");
            mockNodeEnv = "production";

            // Mock connect to reject
            mockPool.connect.mockRejectedValue(connectionError);

            const service = new DatabaseService();

            // Wait for the promise rejection to be handled
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Verify the service was created and connect was called
            expect(service.db).toBe(mockDrizzle);
            expect(mockPool.connect).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it("should not setup production handlers in test environment", () => {
            mockNodeEnv = "test";

            const service = new DatabaseService();

            // Should not call connect in test environment
            expect(mockPool.connect).not.toHaveBeenCalled();

            // Should still setup error handler
            expect(mockPool.on).toHaveBeenCalledWith("error", expect.any(Function));

            // Should not setup connect handler in test environment
            const calls = mockPool.on.mock.calls;
            const connectCalls = calls.filter((call: any) => call[0] === "connect");
            expect(connectCalls).toHaveLength(0);

            // Service should still be created properly
            expect(service.db).toBe(mockDrizzle);
        });
    });
});
