import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { type ICacheService } from "@/services/cache.service";
import { Request, Response, NextFunction } from "express-serve-static-core";
import { inject, injectable } from "inversify";
import { RateLimiterRedis } from "rate-limiter-flexible";

@injectable()
export default class RefreshRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;

    constructor(@inject(TYPES.ICacheService) private readonly cacheService: ICacheService) {
        this.limiter = new RateLimiterRedis({
            storeClient: cacheService.client,
            keyPrefix: "rl_refresh",
            points: 20,
            duration: 60,
        });
    }

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        const key = (req as any).user?.id ?? req.ip;

        try {
            await this.limiter.consume(key);
            next();
        } catch (_err) {
            console.error("Rate limit exceeded for refresh token");
            res.status(429).json({
                success: false,
                data: null,
                message: "Too many refresh requests, slow down.",
            });
        }
    }
}
