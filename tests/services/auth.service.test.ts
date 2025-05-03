import "reflect-metadata";
import AuthService from "@/services/auth.service";
import { IUserRepository } from "@/repositories/UserRepository";
import { ITokenRepository } from "@/repositories/TokenRepository";
import * as passwordUtils from "@/utils/password";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { ACCESS_LIFETIME, REFRESH_IDLE_TTL, JWT_SECRET, JWT_REFRESH_SECRET } from "@/config/env";

jest.mock("jsonwebtoken");
jest.mock("uuid");
jest.mock("@/utils/password");

describe("AuthService", () => {
    let userRepo: jest.Mocked<IUserRepository>;
    let tokenRepo: jest.Mocked<ITokenRepository>;
    let svc: AuthService;

    beforeEach(() => {
        userRepo = {
            findByEmail: jest.fn(),
            create: jest.fn(),
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

        svc = new AuthService(userRepo, tokenRepo);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("register", () => {
        const dto = { email: "u@x.com", password: "pwd" };

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
});
