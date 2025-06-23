import "reflect-metadata";

// 1) Define a mock for the limiter’s consume method
const mockConsume = jest.fn();

// 2) Mock the RateLimiterRedis constructor to return an object with our mockConsume
jest.mock("rate-limiter-flexible", () => ({
    RateLimiterRedis: jest.fn().mockImplementation(() => ({
        consume: mockConsume,
    })),
}));

import LoginRateLimiter from "@/middlewares/login-rate-limiter";
import { createMockLoggerService } from "../../mocks/services/mock-logger.service";

describe("LoginRateLimiter", () => {
    let middleware: LoginRateLimiter;
    let req: any;
    let res: any;
    let next: jest.Mock;
    let mockLogger: any;

    beforeEach(() => {
        // Provide a dummy cacheService with a .client property
        const cacheService = { client: {} };

        // Create mock logger
        mockLogger = createMockLoggerService();

        middleware = new LoginRateLimiter(cacheService as any, mockLogger);

        // Fake Express req/res/next
        req = {
            headers: {},
            ip: undefined,
            get: jest.fn().mockReturnValue("test-agent"),
            path: "/test",
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();

        // Silence console.error
        jest.spyOn(console, "error").mockImplementation(() => undefined);

        // Reset the mockConsume between tests
        mockConsume.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("returns 500 if req.ip is missing", async () => {
        // ip is undefined by default
        await middleware.handle(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Internal server error",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("calls next() when under the rate limit", async () => {
        req.ip = "1.2.3.4";
        mockConsume.mockResolvedValue(undefined);

        await middleware.handle(req, res, next);

        expect(mockConsume).toHaveBeenCalledWith("1.2.3.4");
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    it("returns 429 when rate limit is exceeded", async () => {
        req.ip = "5.6.7.8";
        mockConsume.mockRejectedValue(new Error("rate limit"));

        await middleware.handle(req, res, next);

        expect(mockConsume).toHaveBeenCalledWith("5.6.7.8");
        expect(mockLogger.error).toHaveBeenCalledWith("Rate limit exceeded for login attempt", {
            ip: "5.6.7.8",
            userAgent: "test-agent",
            path: "/test",
        });
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Too many login attempts, please try again later.",
        });
        expect(next).not.toHaveBeenCalled();
    });
});
