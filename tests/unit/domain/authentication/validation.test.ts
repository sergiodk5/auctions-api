import {
    validateUserCredentials,
    validatePasswordMatch,
    validateRefreshTokenPayload,
    validateRefreshTokenNotRevoked,
    validatePasswordResetToken,
    validatePasswordResetTokenExists,
} from "@/domain/authentication/validation";
import { User } from "@/types/user";

describe("Authentication Domain Validation", () => {
    const mockUser: User = {
        id: 1,
        email: "test@example.com",
        emailVerified: false,
        password: "hashedpassword",
    };

    const mockUserWithoutPassword: User = {
        id: 2,
        email: "test2@example.com",
        emailVerified: false,
    };

    describe("validateUserCredentials", () => {
        it("should return user when user exists with password", () => {
            const result = validateUserCredentials(mockUser, "somepassword");
            expect(result).toBe(mockUser);
        });

        it("should throw AuthFailed when user does not exist", () => {
            expect(() => {
                validateUserCredentials(undefined, "somepassword");
            }).toThrow("AuthFailed");
        });

        it("should throw AuthFailed when user exists but has no password", () => {
            expect(() => {
                validateUserCredentials(mockUserWithoutPassword, "somepassword");
            }).toThrow("AuthFailed");
        });
    });

    describe("validatePasswordMatch", () => {
        it("should not throw when password matches", () => {
            expect(() => {
                validatePasswordMatch(true);
            }).not.toThrow();
        });

        it("should throw AuthFailed when password does not match", () => {
            expect(() => {
                validatePasswordMatch(false);
            }).toThrow("AuthFailed");
        });
    });

    describe("validateRefreshTokenPayload", () => {
        it("should return payload when all fields are present", () => {
            const payload = {
                sub: "1",
                jti: "some-jti",
                family_id: "some-family-id",
                other: "field",
            };

            const result = validateRefreshTokenPayload(payload);
            expect(result).toEqual({
                sub: "1",
                jti: "some-jti",
                family_id: "some-family-id",
            });
        });

        it("should throw InvalidRefresh when sub is missing", () => {
            const payload = {
                jti: "some-jti",
                family_id: "some-family-id",
            };

            expect(() => {
                validateRefreshTokenPayload(payload);
            }).toThrow("InvalidRefresh");
        });

        it("should throw InvalidRefresh when jti is missing", () => {
            const payload = {
                sub: "1",
                family_id: "some-family-id",
            };

            expect(() => {
                validateRefreshTokenPayload(payload);
            }).toThrow("InvalidRefresh");
        });

        it("should throw InvalidRefresh when family_id is missing", () => {
            const payload = {
                sub: "1",
                jti: "some-jti",
            };

            expect(() => {
                validateRefreshTokenPayload(payload);
            }).toThrow("InvalidRefresh");
        });
    });

    describe("validateRefreshTokenNotRevoked", () => {
        it("should not throw when token is valid", () => {
            expect(() => {
                validateRefreshTokenNotRevoked(true, "family-id");
            }).not.toThrow();
        });

        it("should throw InvalidRefresh when token is revoked", () => {
            expect(() => {
                validateRefreshTokenNotRevoked(false, "family-id");
            }).toThrow("InvalidRefresh");
        });
    });

    describe("validatePasswordResetToken", () => {
        it("should return payload when all fields are present", () => {
            const payload = {
                sub: 1,
                jti: "some-jti",
                other: "field",
            };

            const result = validatePasswordResetToken(payload);
            expect(result).toEqual({
                sub: 1,
                jti: "some-jti",
            });
        });

        it("should throw InvalidOrExpiredToken when sub is missing", () => {
            const payload = {
                jti: "some-jti",
            };

            expect(() => {
                validatePasswordResetToken(payload);
            }).toThrow("InvalidOrExpiredToken");
        });

        it("should throw InvalidOrExpiredToken when jti is missing", () => {
            const payload = {
                sub: 1,
            };

            expect(() => {
                validatePasswordResetToken(payload);
            }).toThrow("InvalidOrExpiredToken");
        });
    });

    describe("validatePasswordResetTokenExists", () => {
        it("should return user ID string when token exists", () => {
            const result = validatePasswordResetTokenExists("123");
            expect(result).toBe("123");
        });

        it("should throw InvalidOrExpiredToken when token does not exist", () => {
            expect(() => {
                validatePasswordResetTokenExists(null);
            }).toThrow("InvalidOrExpiredToken");
        });

        it("should throw InvalidOrExpiredToken when token is empty string", () => {
            expect(() => {
                validatePasswordResetTokenExists("");
            }).toThrow("InvalidOrExpiredToken");
        });
    });
});