// Mock jwt.decode before importing the controller
jest.mock("jsonwebtoken", () => ({
    decode: jest.fn(),
}));

import "reflect-metadata";
import AuthController from "@/controllers/auth.controller";
import { Request, Response } from "express-serve-static-core";
import jwt from "jsonwebtoken";

describe("AuthController", () => {
    let mockAuthService: any;
    let controller: AuthController;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        mockAuthService = {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            revokeAccess: jest.fn(),
            logout: jest.fn(),
        };
        controller = new AuthController(mockAuthService);

        req = { body: {}, headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            sendStatus: jest.fn(),
        };
        next = jest.fn();

        // Silence console.error if any
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    describe("register", () => {
        it("returns 201 with data on success", async () => {
            const user = { id: 1, email: "a@x.com" };
            mockAuthService.register.mockResolvedValue(user);
            req.body = { cleanBody: { email: "a@x.com", password: "pwd" } };

            await controller.register(req as Request, res as Response);

            expect(mockAuthService.register).toHaveBeenCalledWith({
                email: "a@x.com",
                password: "pwd",
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: user });
        });

        it("returns 409 on error", async () => {
            mockAuthService.register.mockRejectedValue(new Error("UserExists"));
            req.body = { cleanBody: { email: "b@x.com", password: "pwd" } };

            await controller.register(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Email already in use",
            });
        });
    });

    describe("login", () => {
        it("returns success JSON on valid credentials", async () => {
            const payload = {
                user: { id: 2, email: "c@x.com" },
                accessToken: "acc",
                refreshToken: "ref",
            };
            mockAuthService.login.mockResolvedValue(payload);
            req.body = { cleanBody: { email: "c@x.com", password: "pwd" } };

            await controller.login(req as Request, res as Response);

            expect(mockAuthService.login).toHaveBeenCalledWith("c@x.com", "pwd");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: payload,
            });
        });

        it("returns 401 on failure", async () => {
            mockAuthService.login.mockRejectedValue(new Error("AuthFailed"));
            req.body = { cleanBody: { email: "d@x.com", password: "bad" } };

            await controller.login(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid credentials",
            });
        });
    });

    describe("refresh", () => {
        it("returns tokens on success", async () => {
            const tokens = { accessToken: "a2", refreshToken: "r2" };
            mockAuthService.refresh.mockResolvedValue(tokens);
            req.body = { refreshToken: "r" };

            await controller.refresh(req as Request, res as Response);

            expect(mockAuthService.refresh).toHaveBeenCalledWith("r");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: tokens,
            });
        });

        it("returns 403 on failure", async () => {
            mockAuthService.refresh.mockRejectedValue(new Error("Invalid"));
            req.body = { refreshToken: "bad" };

            await controller.refresh(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Access denied",
            });
        });
    });

    describe("revoke", () => {
        it("calls revokeAccess and returns 204", async () => {
            // simulate req.user attached by AuthGuardMiddleware
            (req as any).user = { jti: "j123" };

            await controller.revoke(req as Request, res as Response);

            expect(mockAuthService.revokeAccess).toHaveBeenCalledWith("j123", 15 * 60);
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });
    });

    describe("logout", () => {
        it("returns 403 if no header", async () => {
            req.headers = {};
            await controller.logout(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "No authorization header",
            });
        });

        it("returns 403 on bad scheme", async () => {
            req.headers = { authorization: "Basic token" };
            await controller.logout(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid authorization scheme",
            });
        });

        it("calls authService.logout and returns 204 on valid Bearer", async () => {
            const fakePayload = { jti: "jid", exp: 99999 };
            (jwt.decode as jest.Mock).mockReturnValue(fakePayload);
            req.headers = { authorization: "Bearer atok" };
            req.body = { refreshToken: "rtok" };

            await controller.logout(req as Request, res as Response);

            expect(jwt.decode).toHaveBeenCalledWith("atok");
            expect(mockAuthService.logout).toHaveBeenCalledWith("jid", 99999, "rtok");
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });
    });
});
