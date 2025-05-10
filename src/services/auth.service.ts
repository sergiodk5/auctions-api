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
import type { ITokenRepository } from "@/repositories/TokenRepository";
import type { IUserRepository } from "@/repositories/UserRepository";
import { type ICacheService } from "@/services/cache.service";
import { type IMailer } from "@/services/IMailer";
import { AuthLoginDto, AuthTokensDto, JwtRefreshPayload } from "@/types/auth";
import { CreateUserDto, User } from "@/types/user";
import { comparePassword, hashPassword } from "@/utils/password";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export interface IAuthService {
    register(data: CreateUserDto): Promise<User>;
    login(email: string, password: string): Promise<AuthLoginDto>;
    refresh(refreshToken: string): Promise<AuthTokensDto>;
    revokeAccess(jti: string, ttl: number): Promise<void>;
    logout(accessJti: string, accessExp: number, refreshToken: string): Promise<void>;
}

@injectable()
export default class AuthService {
    constructor(
        @inject(TYPES.IUserRepository) private readonly userRepo: IUserRepository,
        @inject(TYPES.ITokenRepository) private readonly tokenRepo: ITokenRepository,
        @inject(TYPES.ICacheService) private cacheSvc: ICacheService,
        @inject(TYPES.IMailerService) private mailer: IMailer,
    ) {}

    public async register(data: CreateUserDto): Promise<User> {
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) throw new Error("UserExists");
        return this.userRepo.create(data);
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
}
