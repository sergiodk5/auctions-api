/**
 * Authentication domain business rules
 * Pure functions for authentication-related business logic
 */

import { User } from "@/types/user";
import { AuthLoginDto, AuthTokensDto } from "@/types/auth";

/**
 * Business rule for user registration eligibility
 */
export function canRegisterUser(existingUser: User | undefined): boolean {
    return existingUser === undefined;
}

/**
 * Business rule for login eligibility
 */
export function canUserLogin(user: User | undefined): boolean {
    return Boolean(user?.password);
}

/**
 * Business rule for refresh token eligibility
 */
export function canRefreshToken(isTokenValid: boolean): boolean {
    return isTokenValid;
}

/**
 * Business rule for password reset eligibility
 */
export function canRequestPasswordReset(user: User | undefined): boolean {
    return user !== undefined;
}

/**
 * Business rule for logout - determines if access token should be revoked
 */
export function shouldRevokeAccessToken(accessExp: number): boolean {
    const ttl = Math.max(0, Math.ceil((accessExp * 1000 - Date.now()) / 1000));
    return ttl > 0;
}

/**
 * Calculates TTL for access token revocation
 */
export function calculateAccessTokenTTL(accessExp: number): number {
    return Math.max(0, Math.ceil((accessExp * 1000 - Date.now()) / 1000));
}

/**
 * Business rule for token family revocation
 */
export function shouldRevokeTokenFamily(refreshTokenPayload: any): boolean {
    return Boolean(refreshTokenPayload?.family_id);
}

/**
 * Prepares login response data
 */
export function prepareLoginResponse(user: User, accessToken: string, refreshToken: string): AuthLoginDto {
    return {
        user,
        accessToken,
        refreshToken,
    };
}

/**
 * Prepares token refresh response data
 */
export function prepareTokenResponse(accessToken: string, refreshToken: string): AuthTokensDto {
    return {
        accessToken,
        refreshToken,
    };
}

/**
 * Business rule for determining registration workflow
 */
export function shouldSendVerificationEmail(user: User): boolean {
    return !user.emailVerified;
}

/**
 * Business rule for authentication success
 */
export function isAuthenticationSuccessful(user: User | undefined, passwordMatch: boolean): boolean {
    return Boolean(user?.password && passwordMatch);
}