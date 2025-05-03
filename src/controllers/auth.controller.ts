import { Request, Response } from "express-serve-static-core";
import jwt from "jsonwebtoken";
import IAuthService from "@/services/auth.service";
import { inject, injectable } from "inversify";
import { TYPES } from "@/di/types";

export interface IAuthController {
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    refresh(req: Request, res: Response): Promise<void>;
    revoke(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
}

@injectable()
export default class AuthController implements IAuthController {
    constructor(@inject(TYPES.IAuthService) private readonly authService: IAuthService) {}

    async register(req: Request, res: Response) {
        try {
            const user = await this.authService.register(req.body.cleanBody);
            res.status(201).json({ success: true, data: user });
        } catch (e) {
            res.status(409).json({ success: false, message: "Email already in use" });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { user, accessToken, refreshToken } = await this.authService.login(
                req.body.cleanBody.email,
                req.body.cleanBody.password,
            );
            res.json({ success: true, data: { user, accessToken, refreshToken } });
        } catch {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    }

    async refresh(req: Request, res: Response) {
        try {
            const { accessToken, refreshToken } = await this.authService.refresh(req.body.refreshToken);
            res.json({ success: true, data: { accessToken, refreshToken } });
        } catch {
            res.status(403).json({ success: false, message: "Access denied" });
        }
    }

    async revoke(req: Request, res: Response) {
        const { jti } = (req as any).user;
        await this.authService.revokeAccess(jti, 15 * 60);
        res.sendStatus(204);
    }

    async logout(req: Request, res: Response): Promise<void> {
        const auth = req.headers.authorization;
        if (!auth) {
            res.status(403).json({ success: false, message: "No authorization header" });
            return;
        }
        const [scheme, token] = auth.split(" ");
        if (scheme !== "Bearer") {
            res.status(403).json({ success: false, message: "Invalid authorization scheme" });
            return;
        }
        const { jti, exp } = jwt.decode(token) as any;
        await this.authService.logout(jti, exp, req.body.refreshToken);
        res.sendStatus(204);
    }
}
