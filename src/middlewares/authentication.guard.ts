import { JWT_SECRET } from "@/config/env";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { type ITokenRepository } from "@/repositories/token.repository";
import type { ILoggerService } from "@/services/logger.service";
import { JwtAccessPayload } from "@/types/auth";
import { NextFunction, Request, Response } from "express-serve-static-core";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";

@injectable()
export default class AuthenticationGuardMiddleware implements IMiddleware {
    constructor(
        @inject(TYPES.ITokenRepository) private readonly tokenRepo: ITokenRepository,
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
    ) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Unauthorized - Token required",
            });

            return;
        }

        let payload: JwtAccessPayload;
        try {
            payload = jwt.verify(token, JWT_SECRET, { 
                algorithms: ['HS256'] 
            }) as JwtAccessPayload;

            if (typeof payload !== "object" || !payload?.sub || !payload?.jti) {
                res.status(401).json({
                    success: false,
                    data: null,
                    message: "Unauthorized - Invalid token format",
                });

                return;
            }
        } catch (error) {
            this.logger.error("Token verification error", { error });
            res.status(401).json({
                success: false,
                data: null,
                message: "Unauthorized - Invalid token",
            });

            return;
        }

        try {
            if (await this.tokenRepo.isAccessTokenRevoked(payload.jti)) {
                this.logger.error("Token revoked", { jti: payload.jti });
                res.status(401).json({
                    success: false,
                    data: null,
                    message: "Unauthorized - Token revoked",
                });

                return;
            }
        } catch (error) {
            // In test environment or if cache service is not available, skip revocation check
            this.logger.warn("Could not check token revocation status", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }

        req.body ??= {};

        req.body.user = {
            id: payload.sub,
            jti: payload.jti,
        };

        next();
    }
}
