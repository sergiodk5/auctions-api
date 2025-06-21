import app from "@/app";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import { IEmailVerificationRepository } from "@/repositories/email-verification.repository";
import { IUserRepository } from "@/repositories/user.repository";
import { IMailerService } from "@/services/IMailerService";
import crypto from "crypto";
import request from "supertest";
import { cleanupTestDatabase, closeTestDatabase, setupTestDatabase } from "../../helpers/database.helper";

// Generate unique email for test cases to avoid conflicts
const generateUniqueEmail = (base: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    return `${base}-${timestamp}-${randomString}@example.com`;
};

describe("Email Verification Integration Tests", () => {
    let userRepo: IUserRepository;
    let emailVerificationRepo: IEmailVerificationRepository;
    let mailerService: jest.Mocked<IMailerService>;

    beforeAll(() => {
        // Set up test database
        setupTestDatabase();

        userRepo = container.get<IUserRepository>(TYPES.IUserRepository);
        emailVerificationRepo = container.get<IEmailVerificationRepository>(TYPES.IEmailVerificationRepository);
        mailerService = container.get<IMailerService>(TYPES.IMailerService) as jest.Mocked<IMailerService>;

        // Mock the mailer service to prevent actual emails
        mailerService.sendWelcomeEmail = jest.fn().mockResolvedValue(undefined);
    });

    beforeEach(async () => {
        // Clean up database between tests
        await cleanupTestDatabase();
    });

    afterAll(() => {
        // Close database connection to prevent hanging processes
        closeTestDatabase();
    });

    describe("POST /api/v1/auth/verify-email", () => {
        it("should verify email with valid token", async () => {
            // Create a test user with unique email
            const email = generateUniqueEmail("verify-test");
            const user = await userRepo.create({
                email,
                password: "hashedPassword",
            });

            // Create a verification token
            const token = crypto.randomBytes(32).toString("hex");
            await emailVerificationRepo.create(user.id, token);

            const response = await request(app).post("/api/v1/auth/verify-email").send({ token });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Email verified successfully");

            // Verify user is marked as verified
            const updatedUser = await userRepo.findById(user.id);
            expect(updatedUser?.emailVerified).toBe(true);
            expect(updatedUser?.emailVerifiedAt).toBeDefined();
        });

        it("should return 400 for invalid token", async () => {
            const response = await request(app).post("/api/v1/auth/verify-email").send({ token: "invalid-token" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Invalid or expired verification token");
        });

        it("should return 400 for already verified email", async () => {
            // Create a verified user with unique email
            const email = generateUniqueEmail("already-verified");
            const user = await userRepo.create({
                email,
                password: "hashedPassword",
            });
            await userRepo.markEmailAsVerified(user.id);

            // Create a verification token
            const token = crypto.randomBytes(32).toString("hex");
            await emailVerificationRepo.create(user.id, token);

            const response = await request(app).post("/api/v1/auth/verify-email").send({ token });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Email is already verified");
        });

        it("should return 400 for missing token", async () => {
            const response = await request(app).post("/api/v1/auth/verify-email").send({});

            expect(response.status).toBe(400);
        });
    });

    describe("POST /api/v1/auth/resend-verification", () => {
        it("should resend verification email for unverified user", async () => {
            // Create an unverified user with unique email
            const email = generateUniqueEmail("unverified");
            const user = await userRepo.create({
                email,
                password: "hashedPassword",
            });

            const response = await request(app).post("/api/v1/auth/resend-verification").send({ email: user.email });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Verification email sent successfully");
            expect(mailerService.sendWelcomeEmail).toHaveBeenCalledWith(
                user.email,
                expect.stringContaining("/verify-email?token="),
            );
        });

        it("should return 404 for non-existent user", async () => {
            const response = await request(app)
                .post("/api/v1/auth/resend-verification")
                .send({ email: generateUniqueEmail("nonexistent") });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("User not found");
        });

        it("should return 400 for already verified user", async () => {
            // Create a verified user with unique email
            const email = generateUniqueEmail("verified");
            const user = await userRepo.create({
                email,
                password: "hashedPassword",
            });
            await userRepo.markEmailAsVerified(user.id);

            const response = await request(app).post("/api/v1/auth/resend-verification").send({ email: user.email });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Email is already verified");
        });

        it("should return 400 for missing email", async () => {
            const response = await request(app).post("/api/v1/auth/resend-verification").send({});

            expect(response.status).toBe(400);
        });

        it("should delete old tokens and create new one", async () => {
            // Create an unverified user with unique email
            const email = generateUniqueEmail("token-replacement");
            const user = await userRepo.create({
                email,
                password: "hashedPassword",
            });

            // Create an old verification token
            const oldToken = crypto.randomBytes(32).toString("hex");
            await emailVerificationRepo.create(user.id, oldToken);

            // Resend verification
            await request(app).post("/api/v1/auth/resend-verification").send({ email: user.email });

            // Verify old token is no longer valid
            const oldTokenRecord = await emailVerificationRepo.findByToken(oldToken);
            expect(oldTokenRecord).toBeNull();
        });
    });

    describe("Registration with email verification", () => {
        it("should send welcome email after successful registration", async () => {
            const email = generateUniqueEmail("newuser");

            const response = await request(app).post("/api/v1/auth/register").send({
                email,
                password: "password123",
            });

            expect(response.status).toBe(201);
            expect(mailerService.sendWelcomeEmail).toHaveBeenCalledWith(
                email,
                expect.stringContaining("/verify-email?token="),
            );

            // Verify user is created but not verified
            const user = await userRepo.findByEmail(email);
            expect(user?.emailVerified).toBe(false);
            expect(user?.emailVerifiedAt).toBeNull();
        });
    });
});
