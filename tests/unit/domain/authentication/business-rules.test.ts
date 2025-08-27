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
import { User } from "@/types/user";

describe("Authentication Domain Business Rules", () => {
    const mockUser: User = {
        id: 1,
        email: "test@example.com",
        emailVerified: false,
        password: "hashedpassword",
    };

    const mockVerifiedUser: User = {
        id: 2,
        email: "verified@example.com",
        emailVerified: true,
        password: "hashedpassword",
    };

    const mockUserWithoutPassword: User = {
        id: 3,
        email: "nopass@example.com",
        emailVerified: false,
    };

    describe("canRegisterUser", () => {
        it("should return true when user does not exist", () => {
            const result = canRegisterUser(undefined);
            expect(result).toBe(true);
        });

        it("should return false when user already exists", () => {
            const result = canRegisterUser(mockUser);
            expect(result).toBe(false);
        });
    });

    describe("canUserLogin", () => {
        it("should return true when user has password", () => {
            const result = canUserLogin(mockUser);
            expect(result).toBe(true);
        });

        it("should return false when user does not exist", () => {
            const result = canUserLogin(undefined);
            expect(result).toBe(false);
        });

        it("should return false when user has no password", () => {
            const result = canUserLogin(mockUserWithoutPassword);
            expect(result).toBe(false);
        });
    });

    describe("canRefreshToken", () => {
        it("should return true when token is valid", () => {
            const result = canRefreshToken(true);
            expect(result).toBe(true);
        });

        it("should return false when token is invalid", () => {
            const result = canRefreshToken(false);
            expect(result).toBe(false);
        });
    });

    describe("canRequestPasswordReset", () => {
        it("should return true when user exists", () => {
            const result = canRequestPasswordReset(mockUser);
            expect(result).toBe(true);
        });

        it("should return false when user does not exist", () => {
            const result = canRequestPasswordReset(undefined);
            expect(result).toBe(false);
        });
    });

    describe("shouldRevokeAccessToken", () => {
        it("should return true when token has time remaining", () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const result = shouldRevokeAccessToken(futureExp);
            expect(result).toBe(true);
        });

        it("should return false when token has expired", () => {
            const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
            const result = shouldRevokeAccessToken(pastExp);
            expect(result).toBe(false);
        });
    });

    describe("calculateAccessTokenTTL", () => {
        it("should return positive TTL for future expiration", () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const result = calculateAccessTokenTTL(futureExp);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThanOrEqual(3600);
        });

        it("should return 0 for past expiration", () => {
            const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
            const result = calculateAccessTokenTTL(pastExp);
            expect(result).toBe(0);
        });
    });

    describe("shouldRevokeTokenFamily", () => {
        it("should return true when payload has family_id", () => {
            const payload = { family_id: "some-family-id" };
            const result = shouldRevokeTokenFamily(payload);
            expect(result).toBe(true);
        });

        it("should return false when payload has no family_id", () => {
            const payload = { sub: "1", jti: "some-jti" };
            const result = shouldRevokeTokenFamily(payload);
            expect(result).toBe(false);
        });

        it("should return false when payload is null", () => {
            const result = shouldRevokeTokenFamily(null);
            expect(result).toBe(false);
        });
    });

    describe("prepareLoginResponse", () => {
        it("should return properly formatted login response", () => {
            const accessToken = "access-token";
            const refreshToken = "refresh-token";

            const result = prepareLoginResponse(mockUser, accessToken, refreshToken);

            expect(result).toEqual({
                user: mockUser,
                accessToken,
                refreshToken,
            });
        });
    });

    describe("prepareTokenResponse", () => {
        it("should return properly formatted token response", () => {
            const accessToken = "new-access-token";
            const refreshToken = "new-refresh-token";

            const result = prepareTokenResponse(accessToken, refreshToken);

            expect(result).toEqual({
                accessToken,
                refreshToken,
            });
        });
    });

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

    describe("isAuthenticationSuccessful", () => {
        it("should return true when user exists, has password, and password matches", () => {
            const result = isAuthenticationSuccessful(mockUser, true);
            expect(result).toBe(true);
        });

        it("should return false when user does not exist", () => {
            const result = isAuthenticationSuccessful(undefined, true);
            expect(result).toBe(false);
        });

        it("should return false when user has no password", () => {
            const result = isAuthenticationSuccessful(mockUserWithoutPassword, true);
            expect(result).toBe(false);
        });

        it("should return false when password does not match", () => {
            const result = isAuthenticationSuccessful(mockUser, false);
            expect(result).toBe(false);
        });
    });
});