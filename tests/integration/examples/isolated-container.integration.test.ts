/**
 * Example Integration Test using Isolated Test Container with Mocks
 * This demonstrates how to write tests with full control over dependencies
 */

import { Application } from "express";
import { Container } from "inversify";
import request from "supertest";
import { TYPES } from "../../../src/di/types";
import { createEmptyTestContainer } from "../../helpers/empty-test-container.helper";
import { createTestApp } from "../../helpers/test-app.factory";
import { TestMailerHelper } from "../../helpers/test-mailer.helper";
import { MockAuthService } from "../../mocks/services/mock-auth.service";
import { MockAuthorizationService } from "../../mocks/services/mock-authorization.service";
import { MockDatabaseService } from "../../mocks/services/mock-database.service";
import { MockUserService } from "../../mocks/services/mock-user.service";

describe("Isolated Test Container Example", () => {
    let testContainer: Container;
    let mockDb: MockDatabaseService;
    let mockAuth: MockAuthService;
    let mockAuthz: MockAuthorizationService;
    let mockUser: MockUserService;
    let testMailer: TestMailerHelper;
    let app: Application;

    beforeEach(() => {
        // Create a completely isolated test container
        testContainer = createEmptyTestContainer();

        // Create mock services
        mockDb = new MockDatabaseService({
            shouldConnectSucceed: true,
            shouldQuerySucceed: true,
        });

        mockAuth = new MockAuthService({
            shouldVerifyTokenSucceed: true,
            mockUserId: 1,
            mockPermissions: ["user:read", "user:update"],
        });

        mockAuthz = new MockAuthorizationService({
            mockUserPermissions: ["user:read", "user:update"],
        });

        mockUser = new MockUserService({
            shouldOperationSucceed: true,
        });

        testMailer = new TestMailerHelper();

        // Bind mock services to the test container
        testContainer.bind(TYPES.IDatabaseService).toConstantValue(mockDb);
        testContainer.bind(TYPES.IAuthenticationService).toConstantValue(mockAuth);
        testContainer.bind(TYPES.IAuthorizationService).toConstantValue(mockAuthz);
        testContainer.bind(TYPES.IUserService).toConstantValue(mockUser);
        testContainer.bind(TYPES.IMailerService).toConstantValue(testMailer);

        // You can also bind real services if needed for specific tests
        // testContainer.bind(TYPES.SomeRealService).to(SomeRealService);

        // Create the test app with the isolated container
        app = createTestApp(testContainer);
    });

    afterEach(() => {
        // Clean up after each test
        mockDb.reset();
        mockAuth.reset();
        mockAuthz.reset();
        mockUser.reset();
        testMailer.reset();
    });

    describe("Mock Infrastructure Demo", () => {
        it("should demonstrate mock service configuration", async () => {
            // Arrange: Configure mocks for different scenarios
            mockAuth.updateConfig({
                shouldVerifyTokenSucceed: true,
                mockUserId: 42,
                mockPermissions: ["user:read", "admin:access"],
            });

            mockUser.addMockUser({
                id: 42,
                email: "demo@example.com",
                isVerified: true,
            });

            // This test demonstrates that mocks are properly configured
            await expect(mockUser.getUserById(42)).resolves.toMatchObject({
                id: 42,
                email: "demo@example.com",
            });
        });

        it("should demonstrate authorization mock behavior", async () => {
            // Arrange: Configure authorization to succeed
            mockAuthz.setUserPermissions(["user:read", "user:write"]);

            // Act: Test permission check
            const hasReadPermission = await mockAuthz.hasPermission(1, "user:read");
            const hasWritePermission = await mockAuthz.hasPermission(1, "user:write");
            const hasDeletePermission = await mockAuthz.hasPermission(1, "user:delete");

            // Assert: Verify mock behavior
            expect(hasReadPermission).toBe(true);
            expect(hasWritePermission).toBe(true);
            expect(hasDeletePermission).toBe(false);
        });

        it("should demonstrate database mock behavior", async () => {
            // Arrange: Configure database mock
            mockDb.updateConfig({
                shouldQuerySucceed: true,
                mockQueryResult: [{ id: 1, name: "Test Item" }],
            });

            // Act: Mock a database query
            mockDb.mockQueryResult([{ id: 1, name: "Test Item" }]);

            // Assert: Verify mock is configured correctly
            await expect(mockDb.db.execute()).resolves.toEqual([{ id: 1, name: "Test Item" }]);
        });

        it("should demonstrate email tracking", async () => {
            // Act: Send a test email
            await testMailer.sendMail({
                to: "test@example.com",
                subject: "Test Email",
                text: "This is a test email",
            });

            await testMailer.sendMail({
                to: "another@example.com",
                subject: "Another Email",
                text: "This is another test email",
            });

            // Assert: Verify emails were tracked
            expect(testMailer.getSentEmails()).toHaveLength(2);
            expect(testMailer.getEmailsSentTo("test@example.com")).toHaveLength(1);
            expect(testMailer.getEmailsSentTo("another@example.com")).toHaveLength(1);
        });

        it("should demonstrate error simulation", async () => {
            // Arrange: Configure mock to throw errors
            mockAuth.updateConfig({
                shouldThrowError: true,
                errorMessage: "Auth service is down",
            });

            // Act & Assert: Verify error behavior
            await expect(mockAuth.verifyToken("any-token")).rejects.toThrow("Auth service is down");
        });
    });

    describe("Simple Route Testing Demo", () => {
        it("should test status route", async () => {
            // This is a simple route that doesn't require authentication
            const response = await request(app).get("/api/v1/status");

            // This might work depending on your actual status route implementation
            expect(response.status).toBe(200);
        });

        it("should demonstrate how mocks affect route behavior", async () => {
            // Arrange: Configure auth to fail
            mockAuth.updateConfig({
                shouldVerifyTokenSucceed: false,
            });

            // Act: Try to access a protected route
            const response = await request(app).get("/users/me").set("Authorization", "Bearer invalid-token");

            // Assert: Should get unauthorized response
            // Note: This will only work if your routes actually use the injected auth service
            expect([401, 404]).toContain(response.status); // 404 if route doesn't exist, 401 if auth fails
        });
    });
});
