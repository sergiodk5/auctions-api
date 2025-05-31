jest.mock("jsonwebtoken", () => ({
    verify: jest.fn(),
}));

import { JWT_SECRET } from "@/config/env";
import AuthenticationGuardMiddleware from "@/middlewares/authentication.guard";
import jwt from "jsonwebtoken";
import "reflect-metadata";

describe("AuthenticationGuardMiddleware", () => {
    let tokenRepo: { isAccessTokenRevoked: jest.Mock };
    let middleware: AuthenticationGuardMiddleware;
    let req: any;
    let res: any;
    let next: jest.Mock;

    beforeEach(() => {
        // Create a fresh mock repo & middleware
        tokenRepo = { isAccessTokenRevoked: jest.fn() };
        middleware = new AuthenticationGuardMiddleware(tokenRepo as any);

        // Fake Express req/res/next
        req = { headers: {}, body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();

        // Silence console.error
        jest.spyOn(console, "error").mockImplementation(() => undefined);

        // Reset the mock implementation of jwt.verify
        (jwt.verify as jest.Mock).mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("denies when no Authorization header", async () => {
        await middleware.handle(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Access denied",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("denies when jwt.verify throws", async () => {
        req.headers.authorization = "Bearer badtoken";
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error("fail");
        });

        await middleware.handle(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("badtoken", JWT_SECRET);
        expect(console.error).toHaveBeenCalledWith("Token verification error:", expect.any(Error));
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it("denies when payload missing id", async () => {
        req.headers.authorization = "Bearer tok";
        (jwt.verify as jest.Mock).mockReturnValue({ sub: "u", jti: "j" });

        await middleware.handle(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            data: null,
            message: "Access denied",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("denies when token is revoked", async () => {
        req.headers.authorization = "Bearer tok2";
        (jwt.verify as jest.Mock).mockReturnValue({ id: "X", sub: "u2", jti: "j2" });
        tokenRepo.isAccessTokenRevoked.mockResolvedValue(true);

        await middleware.handle(req, res, next);

        expect(tokenRepo.isAccessTokenRevoked).toHaveBeenCalledWith("j2");
        expect(console.error).toHaveBeenCalledWith("Token revoked");
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it("allows and populates req.body.user when token is valid", async () => {
        req.headers.authorization = "Bearer good";
        (jwt.verify as jest.Mock).mockReturnValue({ id: "X", sub: "user123", jti: "jti123" });
        tokenRepo.isAccessTokenRevoked.mockResolvedValue(false);

        await middleware.handle(req, res, next);

        expect(tokenRepo.isAccessTokenRevoked).toHaveBeenCalledWith("jti123");
        expect(req.body.user).toEqual({ id: "user123", jti: "jti123" });
        expect(next).toHaveBeenCalled();
    });
});
