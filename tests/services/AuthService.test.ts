import jwt from "jsonwebtoken";
import { AuthService } from "@/services/auth.service";
import { IUserRepository } from "@/repositories/IUserRepository";
import { ITokenRepository } from "@/repositories/ITokenRepository";
import { CreateUserDto } from "@/types/user";
import * as passwordUtils from "@/utils/password";

describe("AuthService", () => {
    const mockUserRepo: jest.Mocked<IUserRepository> = {
        findAll: jest.fn(),
        findById: jest.fn(),
        findByEmail: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };
    const mockTokenRepo: jest.Mocked<ITokenRepository> = {
        storeRefreshToken: jest.fn(),
        revokeRefreshToken: jest.fn(),
        revokeFamily: jest.fn(),
        isRefreshTokenValid: jest.fn(),
        addToDenyList: jest.fn(),
        isAccessTokenRevoked: jest.fn(),
    };
    const authService = new AuthService(mockUserRepo, mockTokenRepo);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("register", () => {
        it("should throw if user exists", async () => {
            mockUserRepo.findByEmail.mockResolvedValue({ id: 1, email: "a@b.com" });
            await expect(authService.register({ email: "a@b.com", password: "pwd" })).rejects.toThrow("UserExists");
        });

        it("should create a new user", async () => {
            mockUserRepo.findByEmail.mockResolvedValue(undefined);
            const dto: CreateUserDto = { email: "x@y.com", password: "pwd" };
            const created = { id: 2, email: "x@y.com" };
            mockUserRepo.create.mockResolvedValue(created);
            await expect(authService.register(dto)).resolves.toEqual(created);
            expect(mockUserRepo.create).toHaveBeenCalledWith(dto);
        });
    });

    describe("login", () => {
        const user = { id: 3, email: "u@d.com" };
        it("should throw on invalid credentials", async () => {
            mockUserRepo.findByEmail.mockResolvedValue(undefined);
            await expect(authService.login("u@d.com", "bad")).rejects.toThrow("AuthFailed");
        });

        it("should return tokens on valid login", async () => {
            const plain = "pass";
            mockUserRepo.findByEmail.mockResolvedValue({ ...user, password: "hash" } as any);
            const compare = jest.spyOn(passwordUtils, "comparePassword").mockResolvedValue(true);
            mockTokenRepo.storeRefreshToken.mockResolvedValue();

            const result = await authService.login(user.email, plain);
            expect(result.user.id).toEqual(user.id);
            expect(typeof result.accessToken).toBe("string");
            expect(typeof result.refreshToken).toBe("string");
            compare.mockRestore();
        });
    });

    describe("revokeAccess", () => {
        it("should add jti to deny list", async () => {
            await authService.revokeAccess("test-jti", 120);
            expect(mockTokenRepo.addToDenyList).toHaveBeenCalledWith("test-jti", 120);
        });
    });

    describe("refresh", () => {
        it("should throw if invalid refresh token", async () => {
            await expect(authService.refresh("bad")).rejects.toBeDefined();
        });

        it("should rotate tokens on valid refresh", async () => {
            const payload = { sub: 1, jti: "old", family_id: "fam" };
            jest.spyOn(jwt, "verify").mockReturnValue(payload as any);
            mockTokenRepo.isRefreshTokenValid.mockResolvedValue(true);
            mockTokenRepo.revokeRefreshToken.mockResolvedValue();
            mockTokenRepo.storeRefreshToken.mockResolvedValue();

            const result = await authService.refresh("token");
            expect(typeof result.accessToken).toBe("string");
            expect(typeof result.refreshToken).toBe("string");
        });

        it("should handle missing jti by revoking family and throwing", async () => {
            const payloadNoJti = { sub: 1, family_id: "fam" } as any;
            jest.spyOn(jwt, "verify").mockReturnValueOnce(payloadNoJti);
            await expect(authService.refresh("token")).rejects.toThrow("InvalidRefresh");
            expect(mockTokenRepo.revokeFamily).toHaveBeenCalledWith("fam");
        });

        it("should handle invalid tokens by revoking family and throwing", async () => {
            const payload = { sub: 1, jti: "old", family_id: "fam" } as any;
            jest.spyOn(jwt, "verify").mockReturnValueOnce(payload);
            mockTokenRepo.isRefreshTokenValid.mockResolvedValueOnce(false);
            await expect(authService.refresh("token")).rejects.toThrow("InvalidRefresh");
            expect(mockTokenRepo.revokeFamily).toHaveBeenCalledWith("fam");
        });
    });

    describe("logout", () => {
        const accessJti = "access-jti";
        const refreshToken = "valid-refresh-token";
        const exp = Math.floor(Date.now() / 1000) + 300;

        beforeEach(() => {
            jest.spyOn(jwt, "verify").mockReturnValue({ family_id: "fam", jti: accessJti, exp } as any);
            mockTokenRepo.addToDenyList.mockResolvedValue();
            mockTokenRepo.revokeFamily.mockResolvedValue();
        });

        it("should revoke access token and refresh family", async () => {
            await authService.logout(accessJti, exp, refreshToken);
            expect(mockTokenRepo.addToDenyList).toHaveBeenCalledWith(accessJti, expect.any(Number));
            expect(mockTokenRepo.revokeFamily).toHaveBeenCalledWith("fam");
        });

        it("should handle invalid refresh token gracefully", async () => {
            jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
                throw new Error();
            });
            await expect(authService.logout(accessJti, exp, "bad")).resolves.toBeUndefined();
            expect(mockTokenRepo.addToDenyList).toHaveBeenCalledWith(accessJti, expect.any(Number));
            expect(mockTokenRepo.revokeFamily).not.toHaveBeenCalled();
        });
    });
});
