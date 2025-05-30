import { TYPES } from "@/di/types";
import IAuthenticationService from "@/services/authentication.service";
import { Request, Response } from "express-serve-static-core";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";

export interface IAuthController {
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    refresh(req: Request, res: Response): Promise<void>;
    revoke(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
    forgotPassword(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;
    verifyEmail(req: Request, res: Response): Promise<void>;
    resendVerificationEmail(req: Request, res: Response): Promise<void>;
}

@injectable()
export default class AuthController implements IAuthController {
    constructor(@inject(TYPES.IAuthenticationService) private readonly authenticationService: IAuthenticationService) {}

    public async register(req: Request, res: Response) {
        try {
            const user = await this.authenticationService.register(req.body.cleanBody);
            res.status(201).json({ success: true, data: user });
        } catch (e) {
            res.status(409).json({ success: false, message: "Email already in use" });
        }
    }

    public async login(req: Request, res: Response) {
        try {
            const { user, accessToken, refreshToken } = await this.authenticationService.login(
                req.body.cleanBody.email,
                req.body.cleanBody.password,
            );
            res.json({ success: true, data: { user, accessToken, refreshToken } });
        } catch {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    }

    public async refresh(req: Request, res: Response) {
        try {
            const { accessToken, refreshToken } = await this.authenticationService.refresh(req.body.refreshToken);
            res.json({ success: true, data: { accessToken, refreshToken } });
        } catch {
            res.status(403).json({ success: false, message: "Access denied" });
        }
    }

    public async revoke(req: Request, res: Response) {
        const { jti } = (req as any).user;
        await this.authenticationService.revokeAccess(jti, 15 * 60);
        res.sendStatus(204);
    }

    public async logout(req: Request, res: Response): Promise<void> {
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
        await this.authenticationService.logout(jti, exp, req.body.refreshToken);
        res.sendStatus(204);
    }

    public async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            await this.authenticationService.requestPasswordReset(req.body.email);
            res.sendStatus(204);
        } catch (e) {
            // avoid email enumeration: always respond 204
            res.sendStatus(204);
        }
    }

    public async resetPassword(req: Request, res: Response): Promise<void> {
        const { token, password } = req.body;
        try {
            await this.authenticationService.resetPassword(token, password);
            res.sendStatus(204);
        } catch {
            res.status(400).json({ success: false, message: "Invalid or expired token" });
        }
    }

    public async verifyEmail(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.body.cleanBody;
            await this.authenticationService.verifyEmail(token);
            res.json({ success: true, message: "Email verified successfully" });
        } catch (error) {
            let message = "Email verification failed";

            if (error instanceof Error) {
                if (error.message === "InvalidOrExpiredToken") {
                    message = "Invalid or expired verification token";
                } else if (error.message === "EmailAlreadyVerified") {
                    message = "Email is already verified";
                }
            }

            res.status(400).json({ success: false, message });
        }
    }

    public async resendVerificationEmail(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body.cleanBody;
            await this.authenticationService.resendVerificationEmail(email);
            res.json({ success: true, message: "Verification email sent successfully" });
        } catch (error) {
            let message = "Failed to send verification email";
            let status = 400;

            if (error instanceof Error) {
                if (error.message === "UserNotFound") {
                    message = "User not found";
                    status = 404;
                } else if (error.message === "EmailAlreadyVerified") {
                    message = "Email is already verified";
                    status = 400;
                }
            }

            res.status(status).json({ success: false, message });
        }
    }
}
