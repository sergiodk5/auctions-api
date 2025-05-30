import {
    ACCESS_LIFETIME,
    FRONTEND_URL,
    JWT_REFRESH_SECRET,
    JWT_RESET_SECRET,
    JWT_SECRET,
    REFRESH_IDLE_TTL,
    RESET_PASSWORD_TTL,
} from "@/config/env";
import { TYPES } from "@/di/types";
import type { IEmailVerificationRepository } from "@/repositories/email-verification.repository";
import type { ITokenRepository } from "@/repositories/token.repository";
import type { IUserRepository } from "@/repositories/user.repository";
import { type ICacheService } from "@/services/cache.service";
import { type IMailerService } from "@/services/IMailerService";
import { AuthLoginDto, AuthTokensDto, JwtRefreshPayload } from "@/types/auth";
import { CreateUserDto, User } from "@/types/user";
import { comparePassword, hashPassword } from "@/utils/password.util";
import crypto from "crypto";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export interface IAuthenticationService {
    register(data: CreateUserDto): Promise<User>;
    login(email: string, password: string): Promise<AuthLoginDto>;
    refresh(refreshToken: string): Promise<AuthTokensDto>;
    revokeAccess(jti: string, ttl: number): Promise<void>;
    logout(accessJti: string, accessExp: number, refreshToken: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    resendVerificationEmail(email: string): Promise<void>;
}

@injectable()
export default class AuthenticationService {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository,
        @inject(TYPES.ITokenRepository) private readonly tokenRepo: ITokenRepository,
        @inject(TYPES.IEmailVerificationRepository)
        private readonly emailVerificationRepo: IEmailVerificationRepository,
        @inject(TYPES.ICacheService) private cacheSvc: ICacheService,
        @inject(TYPES.IMailerService) private mailer: IMailerService,
    ) {}

    public async register(data: CreateUserDto): Promise<User> {
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) throw new Error("UserExists");

        const user = await this.userRepo.create(data);

        // Generate verification token and send welcome email
        await this.generateAndSendVerificationEmail(user.id, user.email);

        return user;
    }

    private async generateAndSendVerificationEmail(userId: number, email: string): Promise<void> {
        // Delete any existing verification tokens for this user
        await this.emailVerificationRepo.deleteByUserId(userId);

        // Generate a secure verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Store the verification token
        await this.emailVerificationRepo.create(userId, verificationToken);

        // Create verification link
        const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

        // Send welcome email with verification link
        await this.mailer.sendWelcomeEmail(email, verificationLink);
    }

    public async login(email: string, password: string): Promise<AuthLoginDto> {
        const user = await this.userRepo.findByEmail(email);
        if (!user?.password || !(await comparePassword(password, user?.password))) {
            throw new Error("AuthFailed");
        }
        const familyId = uuidv4();
        const jti = uuidv4();
        const accessToken = jwt.sign({ sub: user.id, jti }, JWT_SECRET, { expiresIn: ACCESS_LIFETIME });
        const refreshToken = jwt.sign({ sub: user.id, jti, family_id: familyId }, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_IDLE_TTL,
        });
        await this.tokenRepo.storeRefreshToken(jti, familyId);
        return { user, accessToken, refreshToken };
    }

    public async refresh(refreshToken: string): Promise<AuthTokensDto> {
        const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtRefreshPayload;
        const { sub, jti: oldJti, family_id } = payload;
        if (!oldJti || !(await this.tokenRepo.isRefreshTokenValid(oldJti))) {
            await this.tokenRepo.revokeFamily(family_id);
            throw new Error("InvalidRefresh");
        }
        await this.tokenRepo.revokeRefreshToken(oldJti);
        const newJti = uuidv4();
        const accessToken = jwt.sign({ sub, jti: newJti }, JWT_SECRET, { expiresIn: ACCESS_LIFETIME });
        const newRefreshToken = jwt.sign({ sub, jti: newJti, family_id }, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_IDLE_TTL,
        });
        await this.tokenRepo.storeRefreshToken(newJti, family_id);
        return { accessToken, refreshToken: newRefreshToken };
    }

    public async revokeAccess(jti: string, ttl: number): Promise<void> {
        await this.tokenRepo.addToDenyList(jti, ttl);
    }

    public async logout(accessJti: string, accessExp: number, refreshToken: string): Promise<void> {
        const ttl = Math.max(0, Math.ceil((accessExp * 1000 - Date.now()) / 1000));
        if (ttl > 0) await this.tokenRepo.addToDenyList(accessJti, ttl);
        try {
            const { family_id } = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtRefreshPayload;
            await this.tokenRepo.revokeFamily(family_id);
        } catch {
            /* do nothing */
        }
    }

    public async requestPasswordReset(email: string): Promise<void> {
        const user = await this.userRepo.findByEmail(email);
        if (!user) throw new Error("UserNotFound");

        const jti = uuidv4();
        const token = jwt.sign({ sub: user.id, jti }, JWT_RESET_SECRET, {
            expiresIn: Number(RESET_PASSWORD_TTL),
        });

        await this.cacheSvc.client.set(`pwreset:jti:${jti}`, user.id.toString(), {
            EX: Number(RESET_PASSWORD_TTL),
        });

        const link = `${FRONTEND_URL}/reset-password?token=${token}`;
        await this.mailer.sendPasswordReset(user.email, link);
    }

    public async resetPassword(token: string, newPassword: string): Promise<void> {
        let payload: { sub: number; jti: string };
        try {
            payload = jwt.verify(token, JWT_RESET_SECRET) as any;
        } catch {
            throw new Error("InvalidOrExpiredToken");
        }

        const key = `pwreset:jti:${payload.jti}`;
        const userIdStr = await this.cacheSvc.client.get(key);
        if (!userIdStr) throw new Error("InvalidOrExpiredToken");

        await this.cacheSvc.client.del(key);

        const hashed = await hashPassword(newPassword);
        await this.userRepo.update(Number(userIdStr), { password: hashed });
    }

    public async verifyEmail(token: string): Promise<void> {
        const verification = await this.emailVerificationRepo.findByToken(token);
        if (!verification) {
            throw new Error("InvalidOrExpiredToken");
        }

        // Check if user exists
        const user = await this.userRepo.findById(verification.userId);
        if (!user) {
            throw new Error("UserNotFound");
        }

        // Check if email is already verified
        if (user.emailVerified) {
            throw new Error("EmailAlreadyVerified");
        }

        // Mark verification as used
        await this.emailVerificationRepo.markAsVerified(verification.id);

        // Mark user email as verified
        await this.userRepo.markEmailAsVerified(verification.userId);
    }

    public async resendVerificationEmail(email: string): Promise<void> {
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            throw new Error("UserNotFound");
        }

        if (user.emailVerified) {
            throw new Error("EmailAlreadyVerified");
        }

        // Generate and send new verification email
        await this.generateAndSendVerificationEmail(user.id, user.email);
    }
}
