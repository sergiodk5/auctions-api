/**
 * Authentication domain validation rules
 * Pure functions for authentication-related validation logic
 */

import { User } from "@/types/user";

/**
 * Validates user credentials for login
 */
export function validateUserCredentials(user: User | undefined, providedPassword: string): User {
    if (!user?.password) {
        throw new Error("AuthFailed");
    }
    return user;
}

/**
 * Validates that password verification was successful
 */
export function validatePasswordMatch(isPasswordValid: boolean): void {
    if (!isPasswordValid) {
        throw new Error("AuthFailed");
    }
}

/**
 * Validates refresh token payload structure
 */
export function validateRefreshTokenPayload(payload: any): {
    sub: string;
    jti: string;
    family_id: string;
} {
    if (!payload.sub || !payload.jti || !payload.family_id) {
        throw new Error("InvalidRefresh");
    }
    return {
        sub: payload.sub,
        jti: payload.jti,
        family_id: payload.family_id,
    };
}

/**
 * Validates that refresh token is not revoked
 */
export function validateRefreshTokenNotRevoked(isValid: boolean, familyId: string): void {
    if (!isValid) {
        throw new Error("InvalidRefresh");
    }
}

/**
 * Validates password reset token payload
 */
export function validatePasswordResetToken(payload: any): { sub: number; jti: string } {
    if (!payload.sub || !payload.jti) {
        throw new Error("InvalidOrExpiredToken");
    }
    return {
        sub: payload.sub,
        jti: payload.jti,
    };
}

/**
 * Validates that password reset token exists in cache
 */
export function validatePasswordResetTokenExists(userIdStr: string | null): string {
    if (!userIdStr) {
        throw new Error("InvalidOrExpiredToken");
    }
    return userIdStr;
}

/**
 * Validates that user exists and can request password reset
 */
export function validateUserCanResetPassword(user: User | undefined): User {
    if (!user) {
        throw new Error("UserNotFound");
    }
    return user;
}