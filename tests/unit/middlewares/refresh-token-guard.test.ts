jest.mock("jsonwebtoken", () => ({
    verify: jest.fn(),
}));

import { JWT_REFRESH_SECRET } from "@/config/env";
import RefreshTokenGuardMiddleware from "@/middlewares/refresh-token.guard";
import type { ILoggerService } from "@/services/logger.service";
import jwt from "jsonwebtoken";
import "reflect-metadata";
import { createMockLoggerService } from "../../mocks/services/mock-logger.service";

describe("RefreshTokenGuardMiddleware", () => {
    let tokenRepo: { isRefreshTokenValid: jest.Mock };
    let middleware: RefreshTokenGuardMiddleware;
    let req: any;
    let res: any;
    let next: jest.Mock;
    let mockLogger: ILoggerService;

    beforeEach(() => {
        mockLogger = createMockLoggerService();
        tokenRepo = { isRefreshTokenValid: jest.fn() };
        middleware = new RefreshTokenGuardMiddleware(tokenRepo as any, mockLogger);
        req = { cookies: {}, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        (jwt.verify as jest.Mock).mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("denies when no refresh token cookie", async () => {
        await middleware.handle(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Refresh token required",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("denies when jwt.verify throws", async () => {
        req.cookies.refreshToken = "bad";
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error("fail");
        });

        await middleware.handle(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("bad", JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
        expect(mockLogger.error).toHaveBeenCalledWith("Refresh token verification error", { error: expect.any(Error) });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Invalid refresh token",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("denies when token repo says invalid", async () => {
        req.cookies.refreshToken = "tok";
        (jwt.verify as jest.Mock).mockReturnValue({ sub: "u1", jti: "j1", family_id: "f1" });
        tokenRepo.isRefreshTokenValid.mockResolvedValue(false);

        await middleware.handle(req, res, next);

        expect(tokenRepo.isRefreshTokenValid).toHaveBeenCalledWith("j1");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Invalid refresh token",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("allows when token valid", async () => {
        req.cookies.refreshToken = "tok";
        (jwt.verify as jest.Mock).mockReturnValue({ sub: "u2", jti: "j2", family_id: "f2" });
        tokenRepo.isRefreshTokenValid.mockResolvedValue(true);

        await middleware.handle(req, res, next);

        expect(req.body.refreshToken).toBe("tok");
        expect(req.body.user).toEqual({ id: "u2", jti: "j2" });
        expect(next).toHaveBeenCalled();
    });
});
