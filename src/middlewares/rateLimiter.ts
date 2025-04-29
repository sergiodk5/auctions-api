import { Request, Response, NextFunction } from "express-serve-static-core";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from "@/config/redisClient";

// /login: 5 attempts/minute per IP, block 5m
const loginLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl_login",
    points: 5,
    duration: 60,
    blockDuration: 300,
});

export async function loginRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.ip) {
            throw new Error("IP address not found");
        }

        await loginLimiter.consume(req.ip);
        next();
    } catch {
        console.error("Rate limit exceeded for login attempts");
        res.status(429).json({
            success: false,
            data: null,
            message: "Too many login attempts, please wait.",
        });
    }
}

// /refresh: 20 calls/minute per user or IP
const refreshLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl_refresh",
    points: 20,
    duration: 60,
});

export async function refreshRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    const key = req.body.user?.id ?? req.ip;
    try {
        if (!key) {
            throw new Error("User ID or IP address not found");
        }

        await refreshLimiter.consume(key);
        next();
    } catch {
        console.error("Rate limit exceeded for refresh token");
        res.status(429).json({
            success: false,
            data: null,
            message: "Too many login attempts, please wait.",
        });
    }
}
