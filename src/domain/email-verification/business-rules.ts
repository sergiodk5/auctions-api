/**
 * Email verification domain business rules
 * Pure functions for email verification-related business logic
 */

import { User } from "@/types/user";
import { FRONTEND_URL } from "@/config/env";
import crypto from "crypto";

export interface EmailVerification {
    id: number;
    userId: number;
    token: string;
    verified: boolean;
    createdAt: Date;
}

/**
 * Business rule for verification email eligibility
 */
export function shouldSendVerificationEmail(user: User): boolean {
    return !user.emailVerified;
}

/**
 * Business rule for resending verification email
 */
export function canResendVerificationEmail(user: User | undefined): boolean {
    return Boolean(user && !user.emailVerified);
}

/**
 * Business rule for email verification eligibility
 */
export function canVerifyEmail(user: User, verification: EmailVerification): boolean {
    return !user.emailVerified && !verification.verified;
}

/**
 * Generates a secure verification token
 */
export function generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Creates verification link for email
 */
export function createVerificationLink(token: string): string {
    return `${FRONTEND_URL}/verify-email?token=${token}`;
}

/**
 * Creates password reset link
 */
export function createPasswordResetLink(token: string): string {
    return `${FRONTEND_URL}/reset-password?token=${token}`;
}

/**
 * Business rule for verification token validity
 */
export function isVerificationTokenValid(verification: EmailVerification | undefined): boolean {
    return Boolean(verification && !verification.verified);
}

/**
 * Business rule for verification completion
 */
export function shouldCompleteVerification(user: User, verification: EmailVerification): boolean {
    return !user.emailVerified && !verification.verified;
}

/**
 * Prepares verification data for storage
 */
export function prepareVerificationData(userId: number, token: string) {
    return {
        userId,
        token,
        verified: false,
        createdAt: new Date(),
    };
}

/**
 * Business rule for cleaning up old verification tokens
 */
export function shouldCleanupOldTokens(userId: number): boolean {
    return true; // Always cleanup old tokens before creating new ones
}