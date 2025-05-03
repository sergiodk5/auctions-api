import "reflect-metadata";

// 1) Prepare a mock for consume()
const mockConsume = jest.fn();

// 2) Mock the RateLimiterRedis constructor
jest.mock("rate-limiter-flexible", () => ({
    RateLimiterRedis: jest.fn().mockImplementation(() => ({
        consume: mockConsume,
    })),
}));

import RefreshRateLimiter from "@/middlewares/RefreshRateLimiter";

describe("RefreshRateLimiter", () => {
    let middleware: RefreshRateLimiter;
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
        // Provide a dummy cacheService with a client
        const cacheService = { client: {} };
        middleware = new RefreshRateLimiter(cacheService as any);

        // Initialize req with .user and .ip
        req = { headers: {}, ip: "9.9.9.9", user: undefined };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();

        // Silence console.error
        jest.spyOn(console, "error").mockImplementation(() => undefined);

        // Reset mockConsume
        mockConsume.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("uses req.user.id as key when available", async () => {
        req.user = { id: "user42" };
        mockConsume.mockResolvedValue(undefined);

        await middleware.handle(req, res, next);

        expect(mockConsume).toHaveBeenCalledWith("user42");
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("falls back to req.ip when user.id is missing", async () => {
        // req.user is undefined
        mockConsume.mockResolvedValue(undefined);

        await middleware.handle(req, res, next);

        expect(mockConsume).toHaveBeenCalledWith("9.9.9.9");
        expect(next).toHaveBeenCalled();
    });

    it("returns 429 when consume throws", async () => {
        req.user = { id: "u7" };
        mockConsume.mockRejectedValue(new Error("too many"));

        await middleware.handle(req, res, next);

        expect(mockConsume).toHaveBeenCalledWith("u7");
        expect(console.error).toHaveBeenCalledWith("Rate limit exceeded for refresh token");
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Too many refresh requests, slow down.",
        });
        expect(next).not.toHaveBeenCalled();
    });
});
