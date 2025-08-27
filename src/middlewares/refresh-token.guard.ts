import { JWT_REFRESH_SECRET } from "@/config/env";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import type { ITokenRepository } from "@/repositories/token.repository";
import type { ILoggerService } from "@/services/logger.service";
import { JwtRefreshPayload } from "@/types/auth";
import { NextFunction, Request, Response } from "express-serve-static-core";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";

@injectable()
export default class RefreshTokenGuardMiddleware implements IMiddleware {
    constructor(
        @inject(TYPES.ITokenRepository) private readonly tokenRepo: ITokenRepository,
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
    ) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        const token = (req as any).cookies?.refreshToken;

        if (!token) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Refresh token required",
            });
            return;
        }

        let payload: JwtRefreshPayload;
        try {
            payload = jwt.verify(token, JWT_REFRESH_SECRET, { 
                algorithms: ['HS256'] 
            }) as JwtRefreshPayload;

            if (typeof payload !== "object" || !payload?.jti || !payload?.sub) {
                res.status(401).json({
                    success: false,
                    data: null,
                    message: "Invalid refresh token format",
                });
                return;
            }
        } catch (error) {
            this.logger.error("Refresh token verification error", { error });
            res.status(401).json({
                success: false,
                data: null,
                message: "Invalid refresh token",
            });
            return;
        }

        try {
            if (!(await this.tokenRepo.isRefreshTokenValid(payload.jti))) {
                res.status(401).json({
                    success: false,
                    data: null,
                    message: "Invalid refresh token",
                });
                return;
            }
        } catch (error) {
            this.logger.warn("Could not check refresh token status", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }

        req.body ??= {};
        req.body.refreshToken = token;
        req.body.user = { id: payload.sub, jti: payload.jti };

        next();
    }
}
