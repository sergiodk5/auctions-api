import { ACCESS_LIFETIME, JWT_REFRESH_SECRET, JWT_SECRET, REFRESH_IDLE_TTL } from "@/config/env";
import { IEmailVerificationRepository } from "@/repositories/email-verification.repository";
import { ITokenRepository } from "@/repositories/token.repository";
import { IUserRepository } from "@/repositories/user.repository";
import AuthenticationService from "@/services/authentication.service";
import { ICacheService } from "@/services/cache.service";
import { IMailerService } from "@/services/IMailerService";
import * as passwordUtils from "@/utils/password.util";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import "reflect-metadata";
import { v4 as uuidv4 } from "uuid";

jest.mock("jsonwebtoken");
jest.mock("uuid");
jest.mock("crypto");
jest.mock("@/utils/password.util");

describe("AuthenticationService", () => {
    let userRepo: jest.Mocked<IUserRepository>;
    let tokenRepo: jest.Mocked<ITokenRepository>;
    let emailVerificationRepo: jest.Mocked<IEmailVerificationRepository>;
    let cacheSvc: jest.Mocked<ICacheService>;
    let mailer: jest.Mocked<IMailerService>;
    let svc: AuthenticationService;

    beforeEach(() => {
        userRepo = {
            findByEmail: jest.fn(),
            create: jest.fn(),
            markEmailAsVerified: jest.fn(),
            // not used here:
            findAll: jest.fn() as any,
            findById: jest.fn() as any,
            update: jest.fn() as any,
            delete: jest.fn() as any,
        };
        tokenRepo = {
            storeRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            revokeFamily: jest.fn(),
            isRefreshTokenValid: jest.fn(),
            addToDenyList: jest.fn(),
            isAccessTokenRevoked: jest.fn(),
        };
        emailVerificationRepo = {
            create: jest.fn(),
            findByToken: jest.fn(),
            markAsVerified: jest.fn(),
            deleteByUserId: jest.fn(),
        };
        cacheSvc = {
            client: {
                get: jest.fn(),
                set: jest.fn(),
                del: jest.fn(),
            } as any, // Keep as any for simplicity if specific RedisClient types are complex to mock
        };
        mailer = {
            sendPasswordReset: jest.fn(),
            sendWelcomeEmail: jest.fn(),
        };

        svc = new AuthenticationService(userRepo, tokenRepo, emailVerificationRepo, cacheSvc, mailer);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("register", () => {
        const dto = { email: "u@x.com", password: "pwd" };

        beforeEach(() => {
            (crypto.randomBytes as jest.Mock).mockReturnValue({
                toString: jest.fn().mockReturnValue("mocked-token"),
            });
        });

        it("throws if user already exists", async () => {
            userRepo.findByEmail.mockResolvedValue({ id: 1, email: dto.email } as any);
            await expect(svc.register(dto)).rejects.toThrow("UserExists");
        });

        it("creates and returns new user", async () => {
            const created = { id: 2, email: dto.email } as any;
            userRepo.findByEmail.mockResolvedValue(undefined);
            userRepo.create.mockResolvedValue(created);
            await expect(svc.register(dto)).resolves.toEqual(created);
            expect(userRepo.create).toHaveBeenCalledWith(dto);
        });
    });

    describe("login", () => {
        const email = "u@x.com",
            pass = "pw";

        it("fails when no user", async () => {
            userRepo.findByEmail.mockResolvedValue(undefined);
            await expect(svc.login(email, pass)).rejects.toThrow("AuthFailed");
        });

        it("fails when password mismatch", async () => {
            userRepo.findByEmail.mockResolvedValue({ id: 1, email, password: "hash" } as any);
            (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);
            await expect(svc.login(email, pass)).rejects.toThrow("AuthFailed");
        });

        it("succeeds and stores refresh token", async () => {
            const user = { id: 3, email, password: "hash" } as any;
            userRepo.findByEmail.mockResolvedValue(user);
            (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);

            // mock uuid and jwt
            (uuidv4 as jest.Mock).mockReturnValueOnce("famID").mockReturnValueOnce("jtiID");
            (jwt.sign as jest.Mock).mockReturnValueOnce("accessTok").mockReturnValueOnce("refreshTok");

            const result = await svc.login(email, pass);

            expect(result).toEqual({
                user: { id: 3, email, password: "hash" },
                accessToken: "accessTok",
                refreshToken: "refreshTok",
            });
            expect(tokenRepo.storeRefreshToken).toHaveBeenCalledWith("jtiID", "famID");
            expect(jwt.sign).toHaveBeenNthCalledWith(1, { sub: 3, jti: "jtiID" }, JWT_SECRET, {
                expiresIn: ACCESS_LIFETIME,
            });
            expect(jwt.sign).toHaveBeenNthCalledWith(
                2,
                { sub: 3, jti: "jtiID", family_id: "famID" },
                JWT_REFRESH_SECRET,
                { expiresIn: REFRESH_IDLE_TTL },
            );
        });
    });

    describe("refresh", () => {
        it("rejects and revokes family on invalid jti", async () => {
            (jwt.verify as jest.Mock).mockReturnValue({ sub: 4, jti: "old", family_id: "famX" });
            tokenRepo.isRefreshTokenValid.mockResolvedValue(false);

            await expect(svc.refresh("rtok")).rejects.toThrow("InvalidRefresh");
            expect(tokenRepo.revokeFamily).toHaveBeenCalledWith("famX");
        });

        it("rotates tokens on valid refresh", async () => {
            (jwt.verify as jest.Mock).mockReturnValue({ sub: 5, jti: "old", family_id: "famY" });
            tokenRepo.isRefreshTokenValid.mockResolvedValue(true);
            (uuidv4 as jest.Mock).mockReturnValueOnce("newJti");
            (jwt.sign as jest.Mock).mockReturnValueOnce("newAccess").mockReturnValueOnce("newRefresh");

            const res = await svc.refresh("rtok");
            expect(tokenRepo.revokeRefreshToken).toHaveBeenCalledWith("old");
            expect(tokenRepo.storeRefreshToken).toHaveBeenCalledWith("newJti", "famY");
            expect(res).toEqual({ accessToken: "newAccess", refreshToken: "newRefresh" });
        });
    });

    describe("revokeAccess", () => {
        it("delegates to tokenRepo.addToDenyList", async () => {
            await svc.revokeAccess("jtox", 123);
            expect(tokenRepo.addToDenyList).toHaveBeenCalledWith("jtox", 123);
        });
    });

    describe("logout", () => {
        beforeEach(() => {
            jest.spyOn(Date, "now").mockReturnValue(1_000_000_000_000);
        });

        it("denies access and revokes family on valid token", async () => {
            // exp such that ttl>0
            const exp = (Date.now() + 5_000) / 1000;
            (jwt.verify as jest.Mock).mockReturnValue({ family_id: "famZ" });
            await svc.logout("jta", exp, "rtok");
            expect(tokenRepo.addToDenyList).toHaveBeenCalledWith("jta", expect.any(Number));
            expect(tokenRepo.revokeFamily).toHaveBeenCalledWith("famZ");
        });

        it("skips denyList when TTL<=0, still revokes family", async () => {
            const exp = (Date.now() - 5_000) / 1000;
            (jwt.verify as jest.Mock).mockReturnValue({ family_id: "famK" });
            await svc.logout("jtt", exp, "rtok");
            expect(tokenRepo.addToDenyList).not.toHaveBeenCalled();
            expect(tokenRepo.revokeFamily).toHaveBeenCalledWith("famK");
        });

        it("ignores invalid refreshToken", async () => {
            const exp = (Date.now() + 5_000) / 1000;
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error();
            });
            await svc.logout("jtc", exp, "bad");
            expect(tokenRepo.addToDenyList).toHaveBeenCalled();
            expect(tokenRepo.revokeFamily).not.toHaveBeenCalled();
        });
    });

    describe("requestPasswordReset", () => {
        const email = "user@example.com";

        it("should throw UserNotFound if user does not exist", async () => {
            userRepo.findByEmail.mockResolvedValue(undefined);
            await expect(svc.requestPasswordReset(email)).rejects.toThrow("UserNotFound");
        });

        it("should generate a reset token, cache it, and send an email", async () => {
            const user = { id: 1, email } as any;
            userRepo.findByEmail.mockResolvedValue(user);
            (uuidv4 as jest.Mock).mockReturnValue("test-jti");
            (jwt.sign as jest.Mock).mockReturnValue("reset-token");

            await svc.requestPasswordReset(email);

            expect(uuidv4).toHaveBeenCalled();
            expect(jwt.sign).toHaveBeenCalledWith(
                { sub: user.id, jti: "test-jti" },
                expect.any(String), // JWT_RESET_SECRET
                { expiresIn: expect.any(Number) }, // RESET_PASSWORD_TTL
            );
            expect(cacheSvc.client.set).toHaveBeenCalledWith(
                "pwreset:jti:test-jti",
                user.id.toString(),
                { EX: expect.any(Number) }, // RESET_PASSWORD_TTL
            );
            expect(mailer.sendPasswordReset).toHaveBeenCalledWith(
                email,
                expect.stringContaining("/reset-password?token=reset-token"),
            );
        });
    });

    describe("resetPassword", () => {
        const token = "valid-token";
        const newPassword = "newPassword123";
        const userId = 1;
        const jti = "test-jti";

        it("should throw InvalidOrExpiredToken if jwt.verify fails", async () => {
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error("jwt error");
            });
            await expect(svc.resetPassword(token, newPassword)).rejects.toThrow("InvalidOrExpiredToken");
        });

        it("should throw InvalidOrExpiredToken if jti not in cache", async () => {
            (jwt.verify as jest.Mock).mockReturnValue({ sub: userId, jti });
            (cacheSvc.client.get as jest.Mock).mockResolvedValue(null);
            await expect(svc.resetPassword(token, newPassword)).rejects.toThrow("InvalidOrExpiredToken");
        });

        it("should reset password, delete jti from cache, and update user", async () => {
            (jwt.verify as jest.Mock).mockReturnValue({ sub: userId, jti });
            (cacheSvc.client.get as jest.Mock).mockResolvedValue(userId.toString());
            (passwordUtils.hashPassword as jest.Mock).mockResolvedValue("hashedPassword");

            await svc.resetPassword(token, newPassword);

            expect(cacheSvc.client.del).toHaveBeenCalledWith(`pwreset:jti:${jti}`);
            expect(passwordUtils.hashPassword).toHaveBeenCalledWith(newPassword);
            expect(userRepo.update).toHaveBeenCalledWith(userId, { password: "hashedPassword" });
        });
    });

    describe("generateAndSendVerificationEmail", () => {
        const user = { id: 1, email: "user@example.com" } as any;

        beforeEach(() => {
            (crypto.randomBytes as jest.Mock).mockReturnValue({
                toString: jest.fn().mockReturnValue("mocked-token"),
            });
        });

        it("should generate token, save to database, and send email", async () => {
            // Access the private method using bracket notation for testing
            await (svc as any).generateAndSendVerificationEmail(user.id, user.email);

            expect(emailVerificationRepo.deleteByUserId).toHaveBeenCalledWith(user.id);
            expect(crypto.randomBytes).toHaveBeenCalledWith(32);
            expect(emailVerificationRepo.create).toHaveBeenCalledWith(user.id, "mocked-token");
            expect(mailer.sendWelcomeEmail).toHaveBeenCalledWith(
                user.email,
                expect.stringContaining("/verify-email?token=mocked-token"),
            );
        });
    });

    describe("verifyEmail", () => {
        const token = "valid-token";
        const userId = 1;
        const verificationRecord = { id: 10, userId };

        it("should throw InvalidOrExpiredToken if verification record not found", async () => {
            emailVerificationRepo.findByToken.mockResolvedValue(null);

            await expect(svc.verifyEmail(token)).rejects.toThrow("InvalidOrExpiredToken");
            expect(emailVerificationRepo.findByToken).toHaveBeenCalledWith(token);
        });

        it("should throw UserNotFound if user not found", async () => {
            emailVerificationRepo.findByToken.mockResolvedValue(verificationRecord);
            userRepo.findById.mockResolvedValue(undefined);

            await expect(svc.verifyEmail(token)).rejects.toThrow("UserNotFound");
            expect(userRepo.findById).toHaveBeenCalledWith(userId);
        });

        it("should throw EmailAlreadyVerified if user is already verified", async () => {
            const verifiedUser = { id: userId, emailVerified: true, emailVerifiedAt: new Date() } as any;
            emailVerificationRepo.findByToken.mockResolvedValue(verificationRecord);
            userRepo.findById.mockResolvedValue(verifiedUser);

            await expect(svc.verifyEmail(token)).rejects.toThrow("EmailAlreadyVerified");
        });

        it("should verify email successfully", async () => {
            const unverifiedUser = { id: userId, emailVerified: false, emailVerifiedAt: null } as any;
            emailVerificationRepo.findByToken.mockResolvedValue(verificationRecord);
            userRepo.findById.mockResolvedValue(unverifiedUser);

            await svc.verifyEmail(token);

            expect(emailVerificationRepo.markAsVerified).toHaveBeenCalledWith(verificationRecord.id);
            expect(userRepo.markEmailAsVerified).toHaveBeenCalledWith(userId);
        });
    });

    describe("resendVerificationEmail", () => {
        const email = "user@example.com";
        const user = { id: 1, email, emailVerified: false } as any;

        beforeEach(() => {
            (crypto.randomBytes as jest.Mock).mockReturnValue({
                toString: jest.fn().mockReturnValue("new-token"),
            });
        });

        it("should throw UserNotFound if user not found", async () => {
            userRepo.findByEmail.mockResolvedValue(undefined);

            await expect(svc.resendVerificationEmail(email)).rejects.toThrow("UserNotFound");
        });

        it("should throw EmailAlreadyVerified if user is already verified", async () => {
            const verifiedUser = { ...user, emailVerified: true, emailVerifiedAt: new Date() };
            userRepo.findByEmail.mockResolvedValue(verifiedUser);

            await expect(svc.resendVerificationEmail(email)).rejects.toThrow("EmailAlreadyVerified");
        });

        it("should delete old tokens, create new token, and send email", async () => {
            userRepo.findByEmail.mockResolvedValue(user);

            await svc.resendVerificationEmail(email);

            expect(emailVerificationRepo.deleteByUserId).toHaveBeenCalledWith(user.id);
            expect(emailVerificationRepo.create).toHaveBeenCalledWith(user.id, "new-token");
            expect(mailer.sendWelcomeEmail).toHaveBeenCalledWith(
                email,
                expect.stringContaining("/verify-email?token=new-token"),
            );
        });
    });
});
