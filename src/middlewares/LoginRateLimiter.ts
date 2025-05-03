import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { type ICacheService } from "@/services/cache.service";
import { Request, Response, NextFunction } from "express-serve-static-core";
import { inject, injectable } from "inversify";
import { RateLimiterRedis } from "rate-limiter-flexible";

@injectable()
export default class LoginRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;

    constructor(@inject(TYPES.ICacheService) private readonly cacheService: ICacheService) {
        this.limiter = new RateLimiterRedis({
            storeClient: this.cacheService.client,
            keyPrefix: "rl_login",
            points: 5,
            duration: 60,
            blockDuration: 300,
        });
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (!req.ip) {
            res.status(500).json({
                success: false,
                data: null,
                message: "IP address not found",
            });
            return;
        }

        try {
            await this.limiter.consume(req.ip);
            next();
        } catch (_err) {
            console.error("Rate limit exceeded for refresh token");
            res.status(429).json({
                success: false,
                data: null,
                message: "Too many login  requests, please wait.",
            });
        }
    }
}
