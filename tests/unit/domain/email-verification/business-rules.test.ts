import {
    shouldSendVerificationEmail,
    canResendVerificationEmail,
    canVerifyEmail,
    generateVerificationToken,
    createVerificationLink,
    createPasswordResetLink,
    isVerificationTokenValid,
    shouldCompleteVerification,
    prepareVerificationData,
    shouldCleanupOldTokens,
} from "@/domain/email-verification/business-rules";
import { User } from "@/types/user";
import { EmailVerification } from "@/domain/email-verification/business-rules";

// Mock the env config
jest.mock("@/config/env", () => ({
    FRONTEND_URL: "https://example.com",
}));

// Mock crypto
jest.mock("crypto", () => ({
    randomBytes: jest.fn(() => ({
        toString: jest.fn(() => "a".repeat(64)),
    })),
}));

describe("Email Verification Domain Business Rules", () => {
    const mockUser: User = {
        id: 1,
        email: "test@example.com",
        emailVerified: false,
    };

    const mockVerifiedUser: User = {
        id: 2,
        email: "verified@example.com",
        emailVerified: true,
    };

    const mockVerification: EmailVerification = {
        id: 1,
        userId: 1,
        token: "token123",
        verified: false,
        createdAt: new Date(),
    };

    const mockVerifiedVerification: EmailVerification = {
        id: 2,
        userId: 1,
        token: "token456",
        verified: true,
        createdAt: new Date(),
    };

    describe("shouldSendVerificationEmail", () => {
        it("should return true for unverified user", () => {
            const result = shouldSendVerificationEmail(mockUser);
            expect(result).toBe(true);
        });

        it("should return false for verified user", () => {
            const result = shouldSendVerificationEmail(mockVerifiedUser);
            expect(result).toBe(false);
        });
    });

    describe("canResendVerificationEmail", () => {
        it("should return true for unverified user", () => {
            const result = canResendVerificationEmail(mockUser);
            expect(result).toBe(true);
        });

        it("should return false for verified user", () => {
            const result = canResendVerificationEmail(mockVerifiedUser);
            expect(result).toBe(false);
        });

        it("should return false when user does not exist", () => {
            const result = canResendVerificationEmail(undefined);
            expect(result).toBe(false);
        });
    });

    describe("canVerifyEmail", () => {
        it("should return true when user not verified and verification not used", () => {
            const result = canVerifyEmail(mockUser, mockVerification);
            expect(result).toBe(true);
        });

        it("should return false when user already verified", () => {
            const result = canVerifyEmail(mockVerifiedUser, mockVerification);
            expect(result).toBe(false);
        });

        it("should return false when verification already used", () => {
            const result = canVerifyEmail(mockUser, mockVerifiedVerification);
            expect(result).toBe(false);
        });
    });

    describe("generateVerificationToken", () => {
        it("should generate a 64-character hex token", () => {
            const token = generateVerificationToken();
            expect(token).toBe("a".repeat(64));
        });
    });

    describe("createVerificationLink", () => {
        it("should create proper verification link", () => {
            const token = "test-token";
            const link = createVerificationLink(token);
            expect(link).toBe("https://example.com/verify-email?token=test-token");
        });
    });

    describe("createPasswordResetLink", () => {
        it("should create proper password reset link", () => {
            const token = "reset-token";
            const link = createPasswordResetLink(token);
            expect(link).toBe("https://example.com/reset-password?token=reset-token");
        });
    });

    describe("isVerificationTokenValid", () => {
        it("should return true for unverified verification", () => {
            const result = isVerificationTokenValid(mockVerification);
            expect(result).toBe(true);
        });

        it("should return false for verified verification", () => {
            const result = isVerificationTokenValid(mockVerifiedVerification);
            expect(result).toBe(false);
        });

        it("should return false when verification does not exist", () => {
            const result = isVerificationTokenValid(undefined);
            expect(result).toBe(false);
        });
    });

    describe("shouldCompleteVerification", () => {
        it("should return true when user not verified and verification not used", () => {
            const result = shouldCompleteVerification(mockUser, mockVerification);
            expect(result).toBe(true);
        });

        it("should return false when user already verified", () => {
            const result = shouldCompleteVerification(mockVerifiedUser, mockVerification);
            expect(result).toBe(false);
        });

        it("should return false when verification already used", () => {
            const result = shouldCompleteVerification(mockUser, mockVerifiedVerification);
            expect(result).toBe(false);
        });
    });

    describe("prepareVerificationData", () => {
        it("should prepare verification data with correct structure", () => {
            const userId = 123;
            const token = "test-token";

            const result = prepareVerificationData(userId, token);

            expect(result).toEqual({
                userId: 123,
                token: "test-token",
                verified: false,
                createdAt: expect.any(Date),
            });
        });
    });

    describe("shouldCleanupOldTokens", () => {
        it("should always return true", () => {
            const result = shouldCleanupOldTokens(1);
            expect(result).toBe(true);
        });

        it("should return true for any user ID", () => {
            const result = shouldCleanupOldTokens(999);
            expect(result).toBe(true);
        });
    });
});