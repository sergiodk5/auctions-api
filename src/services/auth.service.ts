import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { IUserRepository } from "@/repositories/IUserRepository";
import { ITokenRepository } from "@/repositories/ITokenRepository";
import { CreateUserDto, User } from "@/types/user";
import { AuthLoginDto, AuthTokensDto, JwtRefreshPayload } from "@/types/auth";
import { comparePassword } from "@/utils/password";
import { ACCESS_LIFETIME, REFRESH_IDLE_TTL, JWT_SECRET, JWT_REFRESH_SECRET } from "@/config/env";

export class AuthService {
    constructor(
        private userRepo: IUserRepository,
        private tokenRepo: ITokenRepository,
    ) {}

    async register(data: CreateUserDto): Promise<User> {
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) throw new Error("UserExists");
        return this.userRepo.create(data);
    }

    async login(email: string, password: string): Promise<AuthLoginDto> {
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

    async refresh(refreshToken: string): Promise<AuthTokensDto> {
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

    async revokeAccess(jti: string, ttl: number): Promise<void> {
        await this.tokenRepo.addToDenyList(jti, ttl);
    }

    async logout(accessJti: string, accessExp: number, refreshToken: string): Promise<void> {
        const ttl = Math.max(0, Math.ceil((accessExp * 1000 - Date.now()) / 1000));
        if (ttl > 0) await this.tokenRepo.addToDenyList(accessJti, ttl);
        try {
            const { family_id } = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtRefreshPayload;
            await this.tokenRepo.revokeFamily(family_id);
        } catch {
            /* do nothing */
        }
    }
}
