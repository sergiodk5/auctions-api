import {
    validateVerificationTokenExists,
    validateUserExistsForVerification,
    validateEmailNotVerified,
    validateCanResendVerificationEmail,
    validateVerificationTokenFormat,
} from "@/domain/email-verification/validation";
import { User } from "@/types/user";
import { EmailVerification } from "@/domain/email-verification/validation";

describe("Email Verification Domain Validation", () => {
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
        token: "a".repeat(64), // 64 char hex token
        verified: false,
        createdAt: new Date(),
    };

    describe("validateVerificationTokenExists", () => {
        it("should return verification when it exists", () => {
            const result = validateVerificationTokenExists(mockVerification);
            expect(result).toBe(mockVerification);
        });

        it("should throw InvalidOrExpiredToken when verification does not exist", () => {
            expect(() => {
                validateVerificationTokenExists(undefined);
            }).toThrow("InvalidOrExpiredToken");
        });
    });

    describe("validateUserExistsForVerification", () => {
        it("should return user when user exists", () => {
            const result = validateUserExistsForVerification(mockUser);
            expect(result).toBe(mockUser);
        });

        it("should throw UserNotFound when user does not exist", () => {
            expect(() => {
                validateUserExistsForVerification(undefined);
            }).toThrow("UserNotFound");
        });
    });

    describe("validateEmailNotVerified", () => {
        it("should not throw when email is not verified", () => {
            expect(() => {
                validateEmailNotVerified(mockUser);
            }).not.toThrow();
        });

        it("should throw EmailAlreadyVerified when email is already verified", () => {
            expect(() => {
                validateEmailNotVerified(mockVerifiedUser);
            }).toThrow("EmailAlreadyVerified");
        });
    });

    describe("validateCanResendVerificationEmail", () => {
        it("should return user when user exists and email not verified", () => {
            const result = validateCanResendVerificationEmail(mockUser);
            expect(result).toBe(mockUser);
        });

        it("should throw UserNotFound when user does not exist", () => {
            expect(() => {
                validateCanResendVerificationEmail(undefined);
            }).toThrow("UserNotFound");
        });

        it("should throw EmailAlreadyVerified when email is already verified", () => {
            expect(() => {
                validateCanResendVerificationEmail(mockVerifiedUser);
            }).toThrow("EmailAlreadyVerified");
        });
    });

    describe("validateVerificationTokenFormat", () => {
        it("should not throw for valid 64-char hex token", () => {
            const validToken = "a".repeat(64);
            expect(() => {
                validateVerificationTokenFormat(validToken);
            }).not.toThrow();
        });

        it("should not throw for valid mixed case hex token", () => {
            const validToken = "A1b2C3d4E5f6".repeat(5) + "abcd"; // 64 chars
            expect(() => {
                validateVerificationTokenFormat(validToken);
            }).not.toThrow();
        });

        it("should throw InvalidToken when token is empty", () => {
            expect(() => {
                validateVerificationTokenFormat("");
            }).toThrow("InvalidToken");
        });

        it("should throw InvalidToken when token is only whitespace", () => {
            expect(() => {
                validateVerificationTokenFormat("   ");
            }).toThrow("InvalidToken");
        });

        it("should throw InvalidTokenFormat when token is too short", () => {
            const shortToken = "a".repeat(32); // 32 chars instead of 64
            expect(() => {
                validateVerificationTokenFormat(shortToken);
            }).toThrow("InvalidTokenFormat");
        });

        it("should throw InvalidTokenFormat when token is too long", () => {
            const longToken = "a".repeat(128); // 128 chars instead of 64
            expect(() => {
                validateVerificationTokenFormat(longToken);
            }).toThrow("InvalidTokenFormat");
        });

        it("should throw InvalidTokenFormat when token contains non-hex characters", () => {
            const invalidToken = "g".repeat(64); // 'g' is not a hex character
            expect(() => {
                validateVerificationTokenFormat(invalidToken);
            }).toThrow("InvalidTokenFormat");
        });

        it("should throw InvalidTokenFormat when token contains special characters", () => {
            const invalidToken = "a".repeat(63) + "!"; // contains '!'
            expect(() => {
                validateVerificationTokenFormat(invalidToken);
            }).toThrow("InvalidTokenFormat");
        });
    });
});