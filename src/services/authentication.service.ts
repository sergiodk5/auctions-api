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

// Domain imports
import { validateUserDoesNotExist, validateUserExists } from "@/domain/user/validation";
import { prepareCreateUserData } from "@/domain/user/business-rules";
import {
    validateUserCredentials,
    validatePasswordMatch,
    validateRefreshTokenPayload,
    validateRefreshTokenNotRevoked,
    validatePasswordResetToken,
    validatePasswordResetTokenExists,
    validateUserCanResetPassword,
} from "@/domain/authentication/validation";
import {
    canRegisterUser,
    canUserLogin,
    canRefreshToken,
    canRequestPasswordReset,
    shouldRevokeAccessToken,
    calculateAccessTokenTTL,
    shouldRevokeTokenFamily,
    prepareLoginResponse,
    prepareTokenResponse,
    shouldSendVerificationEmail,
    isAuthenticationSuccessful,
} from "@/domain/authentication/business-rules";
import {
    validateVerificationTokenExists,
    validateUserExistsForVerification,
    validateEmailNotVerified,
    validateCanResendVerificationEmail,
} from "@/domain/email-verification/validation";
import {
    shouldSendVerificationEmail as shouldSendEmailVerification,
    canResendVerificationEmail,
    generateVerificationToken,
    createVerificationLink,
    createPasswordResetLink,
    shouldCleanupOldTokens,
} from "@/domain/email-verification/business-rules";

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
        // Prepare data according to business rules
        const preparedData = prepareCreateUserData(data);

        // Check if user already exists
        const existing = await this.userRepo.findByEmail(preparedData.email);
        validateUserDoesNotExist(existing, preparedData.email);

        // Apply business rule
        if (!canRegisterUser(existing)) {
            throw new Error("UserExists");
        }

        const user = await this.userRepo.create(preparedData);

        // Generate verification token and send welcome email if needed
        if (shouldSendVerificationEmail(user)) {
            await this.generateAndSendVerificationEmail(user.id, user.email);
        }

        return user;
    }

    private async generateAndSendVerificationEmail(userId: number, email: string): Promise<void> {
        // Apply business rule for cleanup
        if (shouldCleanupOldTokens(userId)) {
            await this.emailVerificationRepo.deleteByUserId(userId);
        }

        // Generate a secure verification token using domain logic
        const verificationToken = generateVerificationToken();

        // Store the verification token
        await this.emailVerificationRepo.create(userId, verificationToken);

        // Create verification link using domain logic
        const verificationLink = createVerificationLink(verificationToken);

        // Send welcome email with verification link
        await this.mailer.sendWelcomeEmail(email, verificationLink);
    }

    public async login(email: string, password: string): Promise<AuthLoginDto> {
        const user = await this.userRepo.findByEmail(email);
        
        // Validate user credentials using domain logic
        validateUserCredentials(user, password);
        
        // Check if user can login
        if (!canUserLogin(user)) {
            throw new Error("AuthFailed");
        }

        // At this point we know user exists and has password due to validation
        const validatedUser = user as User & { password: string };

        // Verify password
        const passwordMatch = await comparePassword(password, validatedUser.password);
        validatePasswordMatch(passwordMatch);

        // Check authentication success
        if (!isAuthenticationSuccessful(validatedUser, passwordMatch)) {
            throw new Error("AuthFailed");
        }

        // Generate tokens
        const familyId = uuidv4();
        const jti = uuidv4();
        const accessToken = jwt.sign({ sub: validatedUser.id.toString(), jti }, JWT_SECRET, { expiresIn: ACCESS_LIFETIME });
        const refreshToken = jwt.sign({ sub: validatedUser.id.toString(), jti, family_id: familyId }, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_IDLE_TTL,
        });
        await this.tokenRepo.storeRefreshToken(jti, familyId);
        
        // Prepare response using domain logic
        return prepareLoginResponse(validatedUser, accessToken, refreshToken);
    }

    public async refresh(refreshToken: string): Promise<AuthTokensDto> {
        const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtRefreshPayload;
        
        // Validate refresh token payload using domain logic
        const { sub, jti: oldJti, family_id } = validateRefreshTokenPayload(payload);
        
        // Check if token is valid
        const isTokenValid = await this.tokenRepo.isRefreshTokenValid(oldJti);
        
        // Apply business rule for refresh eligibility
        if (!canRefreshToken(isTokenValid)) {
            await this.tokenRepo.revokeFamily(family_id);
            throw new Error("InvalidRefresh");
        }

        // Validate token is not revoked
        validateRefreshTokenNotRevoked(isTokenValid, family_id);

        await this.tokenRepo.revokeRefreshToken(oldJti);
        const newJti = uuidv4();
        const accessToken = jwt.sign({ sub, jti: newJti }, JWT_SECRET, { expiresIn: ACCESS_LIFETIME });
        const newRefreshToken = jwt.sign({ sub, jti: newJti, family_id }, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_IDLE_TTL,
        });
        await this.tokenRepo.storeRefreshToken(newJti, family_id);
        
        // Prepare response using domain logic
        return prepareTokenResponse(accessToken, newRefreshToken);
    }

    public async revokeAccess(jti: string, ttl: number): Promise<void> {
        await this.tokenRepo.addToDenyList(jti, ttl);
    }

    public async logout(accessJti: string, accessExp: number, refreshToken: string): Promise<void> {
        // Apply business rule for access token revocation
        if (shouldRevokeAccessToken(accessExp)) {
            const ttl = calculateAccessTokenTTL(accessExp);
            await this.tokenRepo.addToDenyList(accessJti, ttl);
        }

        try {
            const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtRefreshPayload;
            
            // Apply business rule for token family revocation
            if (shouldRevokeTokenFamily(payload)) {
                await this.tokenRepo.revokeFamily(payload.family_id);
            }
        } catch {
            /* do nothing */
        }
    }

    public async requestPasswordReset(email: string): Promise<void> {
        const user = await this.userRepo.findByEmail(email);
        
        // Validate user exists and can reset password
        const validatedUser = validateUserCanResetPassword(user);

        // Apply business rule for password reset eligibility
        if (!canRequestPasswordReset(validatedUser)) {
            throw new Error("UserNotFound");
        }

        const jti = uuidv4();
        const token = jwt.sign({ sub: validatedUser.id, jti }, JWT_RESET_SECRET, {
            expiresIn: Number(RESET_PASSWORD_TTL),
        });

        await this.cacheSvc.client.set(`pwreset:jti:${jti}`, validatedUser.id.toString(), {
            EX: Number(RESET_PASSWORD_TTL),
        });

        // Create reset link using domain logic
        const link = createPasswordResetLink(token);
        await this.mailer.sendPasswordReset(validatedUser.email, link);
    }

    public async resetPassword(token: string, newPassword: string): Promise<void> {
        let payload: { sub: number; jti: string };
        try {
            payload = jwt.verify(token, JWT_RESET_SECRET) as any;
        } catch {
            throw new Error("InvalidOrExpiredToken");
        }

        // Validate password reset token using domain logic
        const validatedPayload = validatePasswordResetToken(payload);

        const key = `pwreset:jti:${validatedPayload.jti}`;
        const userIdStr = await this.cacheSvc.client.get(key);
        
        // Validate token exists using domain logic
        const validatedUserIdStr = validatePasswordResetTokenExists(userIdStr);

        await this.cacheSvc.client.del(key);

        const hashed = await hashPassword(newPassword);
        await this.userRepo.update(Number(validatedUserIdStr), { password: hashed });
    }

    public async verifyEmail(token: string): Promise<void> {
        const verification = await this.emailVerificationRepo.findByToken(token);
        
        // Validate verification token exists using domain logic
        const validVerification = validateVerificationTokenExists(verification);

        // Check if user exists
        const user = await this.userRepo.findById(validVerification.userId);
        
        // Validate user exists using domain logic
        const validUser = validateUserExistsForVerification(user);

        // Check if email is already verified using domain logic
        validateEmailNotVerified(validUser);

        // Mark verification as used
        await this.emailVerificationRepo.markAsVerified(validVerification.id);

        // Mark user email as verified
        await this.userRepo.markEmailAsVerified(validVerification.userId);
    }

    public async resendVerificationEmail(email: string): Promise<void> {
        const user = await this.userRepo.findByEmail(email);
        
        // Validate user can receive verification email using domain logic
        const validUser = validateCanResendVerificationEmail(user);

        // Apply business rule for resending verification email
        if (!canResendVerificationEmail(validUser)) {
            throw new Error("EmailAlreadyVerified");
        }

        // Generate and send new verification email
        await this.generateAndSendVerificationEmail(validUser.id, validUser.email);
    }
}
