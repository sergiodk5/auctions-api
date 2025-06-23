import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { type ICacheService } from "@/services/cache.service";
import type { ILoggerService } from "@/services/logger.service";
import { NextFunction, Request, Response } from "express-serve-static-core";
import { inject, injectable } from "inversify";
import { RateLimiterRedis } from "rate-limiter-flexible";

@injectable()
export default class RefreshRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;

    constructor(
        @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
    ) {
        this.limiter = new RateLimiterRedis({
            storeClient: this.cacheService.client,
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
            this.logger.error("Rate limit exceeded for refresh token", { key, userAgent: req.get("User-Agent") });
            res.status(429).json({
                success: false,
                data: null,
                message: "Too many refresh requests, slow down.",
            });
        }
    }
}
