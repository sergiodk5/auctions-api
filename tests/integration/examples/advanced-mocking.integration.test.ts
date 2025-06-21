import { Application } from "express";
import { Container } from "inversify";
import { Permission } from "../../../src/types/permissions";
import { CreateUserDto, User } from "../../../src/types/user";
import { cleanupTestDatabase, setupTestDatabase } from "../../helpers/database.helper";
import { createEmptyTestContainer } from "../../helpers/empty-test-container.helper";
import { createTestApp } from "../../helpers/test-app.factory";
import { TestMailerHelper } from "../../helpers/test-mailer.helper";
import { MockTokenRepository } from "../../mocks/repositories/mock-token.repository";
import { MockUserRepository } from "../../mocks/repositories/mock-user.repository";
import { MockMailerService } from "../../mocks/services/mock-mailer.service";
import { MockPermissionService } from "../../mocks/services/mock-permission.service";

describe("Advanced Mock Infrastructure Demo", () => {
    let testContainer: Container;
    let app: Application;
    let mailerHelper: TestMailerHelper;

    beforeEach(() => {
        setupTestDatabase();

        // Create fresh container and app for each test
        testContainer = createEmptyTestContainer();
        mailerHelper = new TestMailerHelper();

        // Reset all mocks to clean state
        MockMailerService.resetInstance();
        MockPermissionService.resetInstance();
        MockTokenRepository.resetInstance();
        MockUserRepository.resetInstance();
    });

    afterEach(async () => {
        await cleanupTestDatabase();
        mailerHelper.reset();
    });

    describe("Repository Mocking", () => {
        it("should demonstrate user repository mocking", async () => {
            // Bind mock repositories
            MockUserRepository.bindToContainer(testContainer);
            MockTokenRepository.bindToContainer(testContainer);

            app = createTestApp(testContainer);

            // Configure user repository with test data
            const mockUsers: User[] = [
                {
                    id: 1,
                    email: "test@example.com",
                    password: "hashed_password123",
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                },
            ];
            MockUserRepository.configureInstance({ hashPasswords: true });
            MockUserRepository.getInstance().seedUsers(mockUsers);

            // Test user operations through the repository
            const userRepo = MockUserRepository.getInstance();
            const users = await userRepo.findAll();
            expect(users).toHaveLength(1);
            expect(users[0].email).toBe("test@example.com");
            expect(users[0].password).toBeUndefined(); // Password should be excluded

            // Test user creation
            const newUserData: CreateUserDto = {
                email: "new@example.com",
                password: "plaintext123",
            };
            const createdUser = await userRepo.create(newUserData);
            expect(createdUser.email).toBe("new@example.com");
            expect(createdUser.id).toBe(2);

            // Verify password was hashed
            const userWithPassword = userRepo.findUserWithPassword("new@example.com");
            expect(userWithPassword?.password).toBe("hashed_plaintext123");
        });

        it("should demonstrate token repository mocking", async () => {
            MockTokenRepository.bindToContainer(testContainer);
            app = createTestApp(testContainer);

            const tokenRepo = MockTokenRepository.getInstance();

            // Test token storage
            await tokenRepo.storeRefreshToken("jti123", "family456");
            expect(await tokenRepo.isRefreshTokenValid("jti123")).toBe(true);

            // Test token revocation
            await tokenRepo.revokeRefreshToken("jti123");
            expect(await tokenRepo.isRefreshTokenValid("jti123")).toBe(false);

            // Test deny list
            await tokenRepo.addToDenyList("access123", 3600);
            expect(await tokenRepo.isAccessTokenRevoked("access123")).toBe(true);
        });
    });

    describe("Service Mocking", () => {
        it("should demonstrate permission service mocking", async () => {
            MockPermissionService.bindToContainer(testContainer);
            app = createTestApp(testContainer);

            const permissionService = MockPermissionService.getInstance();

            // Seed test permissions
            const testPermissions: Permission[] = [
                {
                    id: 1,
                    name: "user:read",
                    description: "Read user data",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 2,
                    name: "user:write",
                    description: "Write user data",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];
            permissionService.seedPermissions(testPermissions);

            // Test permission operations
            const permissions = await permissionService.getAllPermissions();
            expect(permissions).toHaveLength(2);

            const userReadPerm = await permissionService.getPermissionByName("user:read");
            expect(userReadPerm.description).toBe("Read user data");

            // Test permission creation
            const newPerm = await permissionService.createPermission({
                name: "product:create",
                description: "Create products",
            });
            expect(newPerm.id).toBe(3);
            expect(newPerm.name).toBe("product:create");
        });

        it("should demonstrate mailer service mocking", async () => {
            MockMailerService.bindToContainer(testContainer);
            app = createTestApp(testContainer);

            const mailerService = MockMailerService.getInstance();

            // Test email sending
            await mailerService.sendWelcomeEmail("user@example.com", "http://verify-link");
            await mailerService.sendPasswordReset("user@example.com", "http://reset-link");

            // Verify emails were tracked
            const sentEmails = mailerService.getSentEmails();
            expect(sentEmails).toHaveLength(2);

            const welcomeEmail = sentEmails.find((e) => e.subject === "Welcome!");
            expect(welcomeEmail?.to).toBe("user@example.com");
            expect(welcomeEmail?.body).toContain("http://verify-link");

            const resetEmail = sentEmails.find((e) => e.subject === "Password Reset");
            expect(resetEmail?.to).toBe("user@example.com");
            expect(resetEmail?.body).toContain("http://reset-link");
        });

        it("should demonstrate error simulation", async () => {
            MockPermissionService.bindToContainer(testContainer);
            app = createTestApp(testContainer);

            const permissionService = MockPermissionService.getInstance();

            // Configure service to simulate errors
            MockPermissionService.configureInstance({
                shouldSimulateError: true,
                errorType: "DatabaseError",
                errorMessage: "Database connection failed",
            });

            // Test that error is thrown
            await expect(permissionService.getAllPermissions()).rejects.toThrow("DatabaseError");

            // Reset error state
            MockPermissionService.configureInstance({ shouldSimulateError: false });

            // Test that service works normally again
            const permissions = await permissionService.getAllPermissions();
            expect(permissions).toEqual([]);
        });
    });

    describe("Integrated Testing", () => {
        it("should demonstrate basic route testing with mocks", async () => {
            // Bind basic mocks
            MockUserRepository.bindToContainer(testContainer);
            MockMailerService.bindToContainer(testContainer);
            MockPermissionService.bindToContainer(testContainer);

            app = createTestApp(testContainer);

            // Configure mocks with test data
            const testUsers: User[] = [
                {
                    id: 1,
                    email: "admin@example.com",
                    password: "hashed_admin123",
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                },
            ];
            MockUserRepository.getInstance().seedUsers(testUsers);

            const testPermissions: Permission[] = [
                {
                    id: 1,
                    name: "user:read",
                    description: "Read users",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];
            MockPermissionService.getInstance().seedPermissions(testPermissions);

            // Test that mocks are working
            const userRepo = MockUserRepository.getInstance();
            const users = await userRepo.findAll();
            expect(users).toHaveLength(1);

            const permissionService = MockPermissionService.getInstance();
            const permissions = await permissionService.getAllPermissions();
            expect(permissions).toHaveLength(1);

            // Verify that services were called appropriately
            const mailerEmails = MockMailerService.getInstance().getSentEmails();
            expect(mailerEmails).toHaveLength(0);
        });
    });
});
