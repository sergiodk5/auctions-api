import "reflect-metadata";

// Mock nodemailer
jest.mock("nodemailer", () => ({
    createTransporter: jest.fn(),
}));

// Mock environment variables
jest.mock("@/config/env", () => ({
    MAILER_FROM_DOMAIN: "test-domain.com",
}));

// Mock DI types
jest.mock("@/di/types", () => ({
    TYPES: {
        MailerTransporter: Symbol("MailerTransporter"),
    },
}));

import { MailerService } from "@/services/mailer.service";
import { type Transporter } from "nodemailer";

describe("MailerService", () => {
    let mailerService: MailerService;
    let mockTransporter: jest.Mocked<Transporter>;

    beforeEach(() => {
        // Create mock transporter
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
        } as any;

        // Create service instance with mocked transporter
        mailerService = new MailerService(mockTransporter);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should create mailer service with transporter", () => {
            expect(mailerService).toBeDefined();
            expect(mailerService).toBeInstanceOf(MailerService);
        });

        it("should implement IMailerService interface", () => {
            expect(mailerService).toHaveProperty("sendWelcomeEmail");
            expect(mailerService).toHaveProperty("sendPasswordReset");
            expect(typeof mailerService.sendWelcomeEmail).toBe("function");
            expect(typeof mailerService.sendPasswordReset).toBe("function");
        });
    });

    describe("sendWelcomeEmail", () => {
        const testEmail = "test@example.com";
        const testVerificationLink = "https://example.com/verify?token=abc123";

        it("should send welcome email with correct parameters", async () => {
            await mailerService.sendWelcomeEmail(testEmail, testVerificationLink);

            expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: '"Welcome to Auctions Platform" <no-reply@test-domain.com>',
                to: testEmail,
                subject: "Welcome! Please verify your email address",
                text: `Welcome to our auctions platform! Please verify your email address by visiting: ${testVerificationLink}`,
                html: expect.stringContaining(testVerificationLink),
            });
        });

        it("should include verification link in HTML content", async () => {
            await mailerService.sendWelcomeEmail(testEmail, testVerificationLink);

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.html).toContain(testVerificationLink);
            expect(callArgs.html).toContain('href="' + testVerificationLink + '"');
            expect(callArgs.html).toContain("Verify Email Address");
        });

        it("should include verification link in text content", async () => {
            await mailerService.sendWelcomeEmail(testEmail, testVerificationLink);

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.text).toContain(testVerificationLink);
            expect(callArgs.text).toContain("Welcome to our auctions platform!");
        });

        it("should use correct sender information", async () => {
            await mailerService.sendWelcomeEmail(testEmail, testVerificationLink);

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.from).toBe('"Welcome to Auctions Platform" <no-reply@test-domain.com>');
            expect(callArgs.to).toBe(testEmail);
            expect(callArgs.subject).toBe("Welcome! Please verify your email address");
        });

        it("should handle transporter errors", async () => {
            const error = new Error("SMTP connection failed");
            mockTransporter.sendMail.mockRejectedValue(error);

            await expect(mailerService.sendWelcomeEmail(testEmail, testVerificationLink)).rejects.toThrow(
                "SMTP connection failed",
            );
        });

        it("should handle different email formats", async () => {
            const specialEmail = "user+test@example.co.uk";

            await mailerService.sendWelcomeEmail(specialEmail, testVerificationLink);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: specialEmail,
                }),
            );
        });
    });

    describe("sendPasswordReset", () => {
        const testEmail = "user@example.com";
        const testResetLink = "https://example.com/reset?token=xyz789";

        it("should send password reset email with correct parameters", async () => {
            await mailerService.sendPasswordReset(testEmail, testResetLink);

            expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: '"No Reply" <no-reply@test-domain.com>',
                to: testEmail,
                subject: "Password Reset Request",
                text: `Reset your password by visiting: ${testResetLink}`,
                html: `<p>Reset your password: <a href="${testResetLink}">${testResetLink}</a></p>`,
            });
        });

        it("should include reset link in both text and HTML content", async () => {
            await mailerService.sendPasswordReset(testEmail, testResetLink);

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.text).toContain(testResetLink);
            expect(callArgs.html).toContain(testResetLink);
            expect(callArgs.html).toContain('href="' + testResetLink + '"');
        });

        it("should use correct sender and subject for password reset", async () => {
            await mailerService.sendPasswordReset(testEmail, testResetLink);

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.from).toBe('"No Reply" <no-reply@test-domain.com>');
            expect(callArgs.to).toBe(testEmail);
            expect(callArgs.subject).toBe("Password Reset Request");
        });

        it("should handle transporter errors during password reset", async () => {
            const error = new Error("Network timeout");
            mockTransporter.sendMail.mockRejectedValue(error);

            await expect(mailerService.sendPasswordReset(testEmail, testResetLink)).rejects.toThrow("Network timeout");
        });

        it("should handle special characters in reset links", async () => {
            const specialResetLink = "https://example.com/reset?token=abc&user=test%40example.com";

            await mailerService.sendPasswordReset(testEmail, specialResetLink);

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.text).toContain(specialResetLink);
            expect(callArgs.html).toContain(specialResetLink);
        });
    });

    describe("integration with MAILER_FROM_DOMAIN", () => {
        it("should use the configured domain for welcome emails", async () => {
            await mailerService.sendWelcomeEmail("test@example.com", "https://verify.link");

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.from).toContain("@test-domain.com");
        });

        it("should use the configured domain for password reset emails", async () => {
            await mailerService.sendPasswordReset("test@example.com", "https://reset.link");

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.from).toContain("@test-domain.com");
        });
    });
});
