import { JWT_SECRET } from "@/config/env";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { type ITokenRepository } from "@/repositories/token.repository";
import { JwtAccessPayload } from "@/types/auth";
import { NextFunction, Request, Response } from "express-serve-static-core";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";

@injectable()
export default class AuthGuardMiddleware implements IMiddleware {
    constructor(@inject(TYPES.ITokenRepository) private readonly tokenRepo: ITokenRepository) {}

    public async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(403).json({
                success: false,
                data: null,
                message: "Access denied",
            });

            return;
        }

        let payload: JwtAccessPayload;
        try {
            payload = jwt.verify(token, JWT_SECRET) as JwtAccessPayload;

            if (typeof payload !== "object" || !payload?.id) {
                res.status(403).json({
                    success: false,
                    data: null,
                    message: "Access denied",
                });

                return;
            }
        } catch (error) {
            console.error("Token verification error:", error);
            res.status(403).json({
                success: false,
                data: null,
                message: "Access denied",
            });

            return;
        }

        if (await this.tokenRepo.isAccessTokenRevoked(payload.jti)) {
            console.error("Token revoked");
            res.status(403).json({
                success: false,
                data: null,
                message: "Access denied",
            });

            return;
        }

        req.body.user = {
            id: payload.sub,
            jti: payload.jti,
        };

        next();
    }
}
