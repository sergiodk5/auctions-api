import { Request, Response } from "express-serve-static-core";
import jwt from "jsonwebtoken";
import { AuthService } from "@/services/auth.service";
import { UserRepository } from "@/repositories/UserRepository";
import { TokenRepository } from "@/repositories/TokenRepository";

const authService = new AuthService(new UserRepository(), new TokenRepository());

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const user = await authService.register(req.body.cleanBody);
            res.status(201).json({ success: true, data: user });
        } catch (e) {
            res.status(409).json({ success: false, message: "Email already in use" });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { user, accessToken, refreshToken } = await authService.login(
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
            const { accessToken, refreshToken } = await authService.refresh(req.body.refreshToken);
            res.json({ success: true, data: { accessToken, refreshToken } });
        } catch {
            res.status(403).json({ success: false, message: "Access denied" });
        }
    }

    async revoke(req: Request, res: Response) {
        const { jti } = (req as any).user;
        await authService.revokeAccess(jti, 15 * 60);
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
        await authService.logout(jti, exp, req.body.refreshToken);
        res.sendStatus(204);
    }
}

export default new AuthController();
