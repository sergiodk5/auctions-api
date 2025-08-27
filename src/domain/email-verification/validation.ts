/**
 * Email verification domain validation rules
 * Pure functions for email verification-related validation logic
 */

import { User } from "@/types/user";

export interface EmailVerification {
    id: number;
    userId: number;
    token?: string;
    verified?: boolean;
    createdAt?: Date;
}

/**
 * Validates that email verification token exists
 */
export function validateVerificationTokenExists(verification: EmailVerification | null | undefined): EmailVerification {
    if (!verification) {
        throw new Error("InvalidOrExpiredToken");
    }
    return verification;
}

/**
 * Validates that user exists for verification
 */
export function validateUserExistsForVerification(user: User | undefined): User {
    if (!user) {
        throw new Error("UserNotFound");
    }
    return user;
}

/**
 * Validates that email is not already verified
 */
export function validateEmailNotVerified(user: User): void {
    if (user.emailVerified) {
        throw new Error("EmailAlreadyVerified");
    }
}

/**
 * Validates that user can receive verification email
 */
export function validateCanResendVerificationEmail(user: User | undefined): User {
    if (!user) {
        throw new Error("UserNotFound");
    }
    
    if (user.emailVerified) {
        throw new Error("EmailAlreadyVerified");
    }
    
    return user;
}

/**
 * Validates verification token format
 */
export function validateVerificationTokenFormat(token: string): void {
    if (!token || token.trim().length === 0) {
        throw new Error("InvalidToken");
    }
    
    // Basic hex token validation (crypto.randomBytes(32).toString("hex") produces 64 char hex)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
        throw new Error("InvalidTokenFormat");
    }
}