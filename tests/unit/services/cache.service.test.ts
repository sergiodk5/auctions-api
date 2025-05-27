import "reflect-metadata";

// Mock the redis module
jest.mock("redis", () => ({
    createClient: jest.fn(),
}));

// Mock environment variables
jest.mock("@/config/env", () => ({
    NODE_ENV: "production", // Default to production for most tests
    REDIS_HOST: "localhost",
    REDIS_PASSWORD: "test-password",
    REDIS_PORT: "6379",
}));

import { NODE_ENV, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "@/config/env";
import CacheService, { ICacheService } from "@/services/cache.service";
import { createClient } from "redis";

describe("CacheService", () => {
    let mockClient: any;
    let mockCreateClient: jest.MockedFunction<typeof createClient>;

    beforeEach(() => {
        mockClient = {
            on: jest.fn(),
            connect: jest.fn().mockResolvedValue(undefined),
        };
        mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
        mockCreateClient.mockReturnValue(mockClient);

        // Mock console methods to avoid noise in tests
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    describe("constructor", () => {
        it("should create Redis client with correct configuration in production", () => {
            const service = new CacheService();

            expect(mockCreateClient).toHaveBeenCalledWith({
                socket: {
                    host: REDIS_HOST,
                    port: Number(REDIS_PORT),
                },
                password: REDIS_PASSWORD,
            });
            expect(service.client).toBe(mockClient);
        });

        it("should set up error event handler", () => {
            new CacheService();

            expect(mockClient.on).toHaveBeenCalledWith("error", expect.any(Function));
        });

        it("should set up connect event handler", () => {
            new CacheService();

            expect(mockClient.on).toHaveBeenCalledWith("connect", expect.any(Function));
        });

        it("should initiate Redis connection", () => {
            new CacheService();

            expect(mockClient.connect).toHaveBeenCalled();
        });

        it("should handle Redis connection errors", async () => {
            const connectionError = new Error("Connection failed");
            mockClient.connect.mockRejectedValue(connectionError);

            new CacheService();

            // Wait for the promise to reject
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(console.error).toHaveBeenCalledWith("Redis Client Connection Error", connectionError);
        });

        it("should log Redis client errors when error event is emitted", () => {
            new CacheService();

            // Find the error handler and call it
            const errorHandler = mockClient.on.mock.calls.find((call: any) => call[0] === "error")?.[1];
            expect(errorHandler).toBeDefined();

            const testError = new Error("Redis error");
            errorHandler(testError);

            expect(console.error).toHaveBeenCalledWith("Redis Client Error", testError);
        });

        it("should log successful connection when connect event is emitted", () => {
            new CacheService();

            // Find the connect handler and call it
            const connectHandler = mockClient.on.mock.calls.find((call: any) => call[0] === "connect")?.[1];
            expect(connectHandler).toBeDefined();

            connectHandler();

            expect(console.log).toHaveBeenCalledWith("Redis Client Connected");
        });
    });

    describe("in test environment", () => {
        beforeEach(() => {
            // Mock NODE_ENV as test for this specific test suite
            (NODE_ENV as any) = "test";
        });

        afterEach(() => {
            // Reset NODE_ENV back to production
            (NODE_ENV as any) = "production";
        });

        it("should create stub client instead of real Redis client", () => {
            const service = new CacheService();

            // Should not call createClient in test environment
            expect(mockCreateClient).not.toHaveBeenCalled();

            // Client should be a stub object
            expect(service.client).toEqual({});
        });
    });

    describe("interface compliance", () => {
        it("should implement ICacheService interface", () => {
            const service: ICacheService = new CacheService();

            expect(service).toHaveProperty("client");
            expect(service.client).toBeDefined();
        });

        it("should have readonly client property", () => {
            const service = new CacheService();

            // Verify the client property exists and matches the mock
            expect(service.client).toBe(mockClient);

            // The client property should be readonly (TypeScript compile-time check)
            // Since it's a readonly property in TypeScript, we just verify it exists
            expect(service.client).toBeDefined();
            expect(typeof service.client).toBe("object");
        });
    });

    describe("Redis configuration", () => {
        it("should use correct port number conversion", () => {
            new CacheService();

            expect(mockCreateClient).toHaveBeenCalledWith({
                socket: {
                    host: "localhost",
                    port: 6379, // Should be converted to number
                },
                password: "test-password",
            });
        });

        it("should handle different environment configurations", () => {
            // Mock different environment values
            (REDIS_HOST as any) = "redis.example.com";
            (REDIS_PORT as any) = "6380";
            (REDIS_PASSWORD as any) = "different-password";

            new CacheService();

            expect(mockCreateClient).toHaveBeenCalledWith({
                socket: {
                    host: "redis.example.com",
                    port: 6380,
                },
                password: "different-password",
            });
        });
    });
});
