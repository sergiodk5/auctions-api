// Mock jwt.decode before importing the controller
jest.mock("jsonwebtoken", () => ({
    decode: jest.fn(),
}));

import AuthController from "@/controllers/auth.controller";
import { Request, Response } from "express-serve-static-core";
import jwt from "jsonwebtoken";
import "reflect-metadata";

describe("AuthController", () => {
    let mockAuthenticationService: any;
    let controller: AuthController;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        mockAuthenticationService = {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            revokeAccess: jest.fn(),
            logout: jest.fn(),
            requestPasswordReset: jest.fn(),
            resetPassword: jest.fn(),
        };
        controller = new AuthController(mockAuthenticationService);

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
            mockAuthenticationService.register.mockResolvedValue(user);
            req.body = { cleanBody: { email: "a@x.com", password: "pwd" } };

            await controller.register(req as Request, res as Response);

            expect(mockAuthenticationService.register).toHaveBeenCalledWith({
                email: "a@x.com",
                password: "pwd",
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: user });
        });

        it("returns 409 on error", async () => {
            mockAuthenticationService.register.mockRejectedValue(new Error("UserExists"));
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
            mockAuthenticationService.login.mockResolvedValue(payload);
            req.body = { cleanBody: { email: "c@x.com", password: "pwd" } };

            await controller.login(req as Request, res as Response);

            expect(mockAuthenticationService.login).toHaveBeenCalledWith("c@x.com", "pwd");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: payload,
            });
        });

        it("returns 401 on failure", async () => {
            mockAuthenticationService.login.mockRejectedValue(new Error("AuthFailed"));
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
            mockAuthenticationService.refresh.mockResolvedValue(tokens);
            req.body = { refreshToken: "r" };

            await controller.refresh(req as Request, res as Response);

            expect(mockAuthenticationService.refresh).toHaveBeenCalledWith("r");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: tokens,
            });
        });

        it("returns 403 on failure", async () => {
            mockAuthenticationService.refresh.mockRejectedValue(new Error("Invalid"));
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
            // simulate req.user attached by AuthenticationGuardMiddleware
            (req as any).user = { jti: "j123" };

            await controller.revoke(req as Request, res as Response);

            expect(mockAuthenticationService.revokeAccess).toHaveBeenCalledWith("j123", 15 * 60);
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

        it("calls authenticationService.logout and returns 204 on valid Bearer", async () => {
            const fakePayload = { jti: "jid", exp: 99999 };
            (jwt.decode as jest.Mock).mockReturnValue(fakePayload);
            req.headers = { authorization: "Bearer atok" };
            req.body = { refreshToken: "rtok" };

            await controller.logout(req as Request, res as Response);

            expect(jwt.decode).toHaveBeenCalledWith("atok");
            expect(mockAuthenticationService.logout).toHaveBeenCalledWith("jid", 99999, "rtok");
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });
    });

    describe("forgotPassword", () => {
        it("should return 204 on successful password reset request", async () => {
            req.body = { email: "user@example.com" };
            mockAuthenticationService.requestPasswordReset.mockResolvedValue(undefined);

            await controller.forgotPassword(req as Request, res as Response);

            expect(mockAuthenticationService.requestPasswordReset).toHaveBeenCalledWith("user@example.com");
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it("should return 204 on service error to avoid email enumeration", async () => {
            req.body = { email: "nonexistent@example.com" };
            mockAuthenticationService.requestPasswordReset.mockRejectedValue(new Error("UserNotFound"));

            await controller.forgotPassword(req as Request, res as Response);

            expect(mockAuthenticationService.requestPasswordReset).toHaveBeenCalledWith("nonexistent@example.com");
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it("should return 204 on any service error to prevent information disclosure", async () => {
            req.body = { email: "user@example.com" };
            mockAuthenticationService.requestPasswordReset.mockRejectedValue(new Error("Service unavailable"));

            await controller.forgotPassword(req as Request, res as Response);

            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });
    });

    describe("resetPassword", () => {
        it("should return 204 on successful password reset", async () => {
            const token = "valid-reset-token";
            const password = "newPassword123";
            req.body = { token, password };
            mockAuthenticationService.resetPassword.mockResolvedValue(undefined);

            await controller.resetPassword(req as Request, res as Response);

            expect(mockAuthenticationService.resetPassword).toHaveBeenCalledWith(token, password);
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it("should return 400 with error message on invalid token", async () => {
            const token = "invalid-token";
            const password = "newPassword123";
            req.body = { token, password };
            mockAuthenticationService.resetPassword.mockRejectedValue(new Error("InvalidOrExpiredToken"));

            await controller.resetPassword(req as Request, res as Response);

            expect(mockAuthenticationService.resetPassword).toHaveBeenCalledWith(token, password);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid or expired token",
            });
        });

        it("should return 400 with error message on expired token", async () => {
            const token = "expired-token";
            const password = "newPassword123";
            req.body = { token, password };
            mockAuthenticationService.resetPassword.mockRejectedValue(new Error("Token expired"));

            await controller.resetPassword(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid or expired token",
            });
        });

        it("should return 400 with error message on any service error", async () => {
            const token = "valid-token";
            const password = "newPassword123";
            req.body = { token, password };
            mockAuthenticationService.resetPassword.mockRejectedValue(new Error("Database error"));

            await controller.resetPassword(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid or expired token",
            });
        });
    });
});
