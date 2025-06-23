import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { type ICacheService } from "@/services/cache.service";
import type { ILoggerService } from "@/services/logger.service";
import { NextFunction, Request, Response } from "express-serve-static-core";
import { inject, injectable } from "inversify";
import { RateLimiterRedis } from "rate-limiter-flexible";

@injectable()
export default class LoginRateLimiter implements IMiddleware {
    private limiter: RateLimiterRedis;

    constructor(
        @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
    ) {
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
                message: "Internal server error",
            });
            return;
        }

        try {
            await this.limiter.consume(req.ip);
            next();
        } catch (_err) {
            this.logger.error("Rate limit exceeded for login attempt", {
                ip: req.ip,
                userAgent: req.get("User-Agent"),
                path: req.path,
            });
            res.status(429).json({
                success: false,
                data: null,
                message: "Too many login attempts, please try again later.",
            });
        }
    }
}
