import AuthController from "@/controllers/auth.controller";
import AuthService from "@/services/auth.service";
import { Request, Response } from "express";
import "reflect-metadata";

jest.mock("@/services/auth.service");

describe("AuthController - Email Verification", () => {
    let controller: AuthController;
    let mockAuthService: jest.Mocked<AuthService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockAuthService = new AuthService(
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
        ) as jest.Mocked<AuthService>;

        // Mock all the AuthService methods
        mockAuthService.verifyEmail = jest.fn();
        mockAuthService.resendVerificationEmail = jest.fn();

        controller = new AuthController(mockAuthService);

        mockRequest = {
            body: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("verifyEmail", () => {
        it("should verify email successfully", async () => {
            const token = "valid-token";
            mockRequest.body = { cleanBody: { token } };

            await controller.verifyEmail(mockRequest as Request, mockResponse as Response);

            expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Email verified successfully",
            });
        });

        it("should handle InvalidOrExpiredToken error", async () => {
            const token = "invalid-token";
            mockRequest.body = { cleanBody: { token } };

            mockAuthService.verifyEmail.mockRejectedValue(new Error("InvalidOrExpiredToken"));

            await controller.verifyEmail(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Invalid or expired verification token",
            });
        });

        it("should handle generic errors", async () => {
            const token = "valid-token";
            mockRequest.body = { cleanBody: { token } };

            mockAuthService.verifyEmail.mockRejectedValue(new Error("Database error"));

            await controller.verifyEmail(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Email verification failed",
            });
        });
    });

    describe("resendVerificationEmail", () => {
        it("should resend verification email successfully", async () => {
            const email = "user@example.com";
            mockRequest.body = { cleanBody: { email } };

            await controller.resendVerificationEmail(mockRequest as Request, mockResponse as Response);

            expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(email);
            expect(mockResponse.status).not.toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Verification email sent successfully",
            });
        });

        it("should handle UserNotFound error", async () => {
            const email = "nonexistent@example.com";
            mockRequest.body = { cleanBody: { email } };

            mockAuthService.resendVerificationEmail.mockRejectedValue(new Error("UserNotFound"));

            await controller.resendVerificationEmail(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "User not found",
            });
        });

        it("should handle EmailAlreadyVerified error", async () => {
            const email = "verified@example.com";
            mockRequest.body = { cleanBody: { email } };

            mockAuthService.resendVerificationEmail.mockRejectedValue(new Error("EmailAlreadyVerified"));

            await controller.resendVerificationEmail(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Email is already verified",
            });
        });

        it("should handle generic errors", async () => {
            const email = "user@example.com";
            mockRequest.body = { cleanBody: { email } };

            mockAuthService.resendVerificationEmail.mockRejectedValue(new Error("Email service error"));

            await controller.resendVerificationEmail(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: "Failed to send verification email",
            });
        });
    });
});
