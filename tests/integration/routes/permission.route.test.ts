import { Application } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { cleanupTestDatabase, setupTestDatabase } from "../../helpers/database.helper";
import { RBACSeeder, resetGlobalSeedingState, RoleName } from "../../helpers/rbac-seeder.helper";
import { createTestApp } from "../../helpers/test-app.factory";

// Helper function to create properly formatted JWT tokens for tests
function createTestJWT(userId: number, jti = "test-jti"): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable is not set");
    }
    return jwt.sign(
        {
            sub: userId.toString(),
            jti: `${jti}-${Date.now()}`,
        },
        jwtSecret,
        { expiresIn: "1h" },
    );
}

describe("Permission Routes Integration Tests", () => {
    let app: Application;
    let rbacSeeder: RBACSeeder;

    beforeAll(() => {
        setupTestDatabase();
        app = createTestApp();
        rbacSeeder = new RBACSeeder();
    });

    beforeEach(async () => {
        resetGlobalSeedingState();
        await cleanupTestDatabase();
        await rbacSeeder.seedAllTransactional();
    });

    afterEach(async () => {
        resetGlobalSeedingState();
        await cleanupTestDatabase();
    });

    describe("GET /api/v1/permissions", () => {
        it("should get all permissions for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            const response = await request(app)
                .get("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: "Permissions retrieved successfully",
            });

            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);

            // Check that we have expected permissions
            const permissionNames = response.body.data.map((p: { name: string }) => p.name);
            expect(permissionNames).toEqual(
                expect.arrayContaining([
                    "user:create",
                    "user:read",
                    "user:update",
                    "user:delete",
                    "product:create",
                    "product:read",
                    "product:update",
                    "product:delete",
                    "role:manage",
                ]),
            );
        });

        it("should reject access for editor user", async () => {
            const editorUser = await rbacSeeder.createTestUser(
                {
                    email: "editor@test.com",
                    password: "password123",
                },
                "editor" as RoleName,
            );

            const token = createTestJWT(editorUser.id);

            const response = await request(app)
                .get("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .expect(403);

            expect(response.body).toMatchObject({
                success: false,
            });
        });

        it("should reject access for client user", async () => {
            const clientUser = await rbacSeeder.createTestUser(
                {
                    email: "client@test.com",
                    password: "password123",
                },
                "client" as RoleName,
            );

            const token = createTestJWT(clientUser.id);

            const response = await request(app)
                .get("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .expect(403);

            expect(response.body).toMatchObject({
                success: false,
            });
        });

        it("should reject access for unauthenticated user", async () => {
            const response = await request(app).get("/api/v1/permissions").expect(401);

            expect(response.body).toMatchObject({
                success: false,
            });
        });
    });

    describe("POST /api/v1/permissions", () => {
        it("should create a new permission for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            const newPermission = {
                name: "test:permission",
                description: "Test permission for integration tests",
            };

            const response = await request(app)
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .send(newPermission)
                .expect(201);

            expect(response.body).toMatchObject({
                success: true,
                message: "Permission created successfully",
            });

            expect(response.body.data).toMatchObject({
                name: newPermission.name,
                description: newPermission.description,
            });

            expect(response.body.data.id).toBeDefined();
        });

        it("should reject creation with duplicate name", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            const duplicatePermission = {
                name: "user:read", // This permission already exists from seeding
                description: "Duplicate permission",
            };

            const response = await request(app)
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .send(duplicatePermission)
                .expect(409);

            expect(response.body).toMatchObject({
                success: false,
                message: "Permission with this name already exists",
            });
        });

        it("should reject creation with invalid data", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            const invalidPermission = {
                // Missing required name field
                description: "Test permission without name",
            };

            const response = await request(app)
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .send(invalidPermission)
                .expect(400);

            expect(response.body).toMatchObject({
                success: false,
            });
        });

        it("should reject creation for non-admin user", async () => {
            const editorUser = await rbacSeeder.createTestUser(
                {
                    email: "editor@test.com",
                    password: "password123",
                },
                "editor" as RoleName,
            );

            const token = createTestJWT(editorUser.id);

            const newPermission = {
                name: "test:permission",
                description: "Test permission",
            };

            const response = await request(app)
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .send(newPermission)
                .expect(403);

            expect(response.body).toMatchObject({
                success: false,
            });
        });
    });

    describe("GET /api/v1/permissions/:id", () => {
        it("should get permission by ID for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            // First, get all permissions to find a valid ID
            const allPermissionsResponse = await request(app)
                .get("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            const firstPermission = allPermissionsResponse.body.data[0];

            const response = await request(app)
                .get(`/api/v1/permissions/${firstPermission.id}`)
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: "Permission retrieved successfully",
            });

            expect(response.body.data).toMatchObject({
                id: firstPermission.id,
                name: firstPermission.name,
                description: firstPermission.description,
            });
        });

        it("should return 404 for non-existent permission", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            const response = await request(app)
                .get("/api/v1/permissions/999999")
                .set("Authorization", `Bearer ${token}`)
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                message: "Permission not found",
            });
        });

        it("should reject access for non-admin user", async () => {
            const editorUser = await rbacSeeder.createTestUser(
                {
                    email: "editor@test.com",
                    password: "password123",
                },
                "editor" as RoleName,
            );

            const token = createTestJWT(editorUser.id);

            const response = await request(app)
                .get("/api/v1/permissions/1")
                .set("Authorization", `Bearer ${token}`)
                .expect(403);

            expect(response.body).toMatchObject({
                success: false,
            });
        });
    });

    describe("PUT /api/v1/permissions/:id", () => {
        it("should update permission for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            // First create a permission to update
            const createResponse = await request(app)
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "test:update",
                    description: "Permission to be updated",
                })
                .expect(201);

            const permissionId = createResponse.body.data.id;

            const updatedData = {
                description: "Updated permission description",
            };

            const response = await request(app)
                .put(`/api/v1/permissions/${permissionId}`)
                .set("Authorization", `Bearer ${token}`)
                .send(updatedData)
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: "Permission updated successfully",
            });

            expect(response.body.data).toMatchObject({
                id: permissionId,
                name: "test:update", // Name should remain unchanged
                description: updatedData.description,
            });
        });

        it("should reject update with duplicate name", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            // Create a permission to update
            const createResponse = await request(app)
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "test:update2",
                    description: "Permission to be updated",
                })
                .expect(201);

            const permissionId = createResponse.body.data.id;

            const duplicateUpdate = {
                name: "user:read", // This name already exists from seeding
            };

            const response = await request(app)
                .put(`/api/v1/permissions/${permissionId}`)
                .set("Authorization", `Bearer ${token}`)
                .send(duplicateUpdate)
                .expect(409);

            expect(response.body).toMatchObject({
                success: false,
                message: "Permission with this name already exists",
            });
        });

        it("should return 404 for non-existent permission", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            const response = await request(app)
                .put("/api/v1/permissions/999999")
                .set("Authorization", `Bearer ${token}`)
                .send({ description: "Updated description" })
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                message: "Permission not found",
            });
        });

        it("should reject update for non-admin user", async () => {
            const editorUser = await rbacSeeder.createTestUser(
                {
                    email: "editor@test.com",
                    password: "password123",
                },
                "editor" as RoleName,
            );

            const token = createTestJWT(editorUser.id);

            const response = await request(app)
                .put("/api/v1/permissions/1")
                .set("Authorization", `Bearer ${token}`)
                .send({ description: "Updated description" })
                .expect(403);

            expect(response.body).toMatchObject({
                success: false,
            });
        });
    });

    describe("DELETE /api/v1/permissions/:id", () => {
        it("should delete permission for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            // First create a permission to delete
            const createResponse = await request(app)
                .post("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "test:delete",
                    description: "Permission to be deleted",
                })
                .expect(201);

            const permissionId = createResponse.body.data.id;

            const response = await request(app)
                .delete(`/api/v1/permissions/${permissionId}`)
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: "Permission deleted successfully",
            });

            // Verify permission is actually deleted
            await request(app)
                .get(`/api/v1/permissions/${permissionId}`)
                .set("Authorization", `Bearer ${token}`)
                .expect(404);
        });

        it("should return 404 for non-existent permission", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                },
                "admin" as RoleName,
            );

            const token = createTestJWT(adminUser.id);

            const response = await request(app)
                .delete("/api/v1/permissions/999999")
                .set("Authorization", `Bearer ${token}`)
                .expect(404);

            expect(response.body).toMatchObject({
                success: false,
                message: "Permission not found",
            });
        });

        it("should reject deletion for non-admin user", async () => {
            const editorUser = await rbacSeeder.createTestUser(
                {
                    email: "editor@test.com",
                    password: "password123",
                },
                "editor" as RoleName,
            );

            const token = createTestJWT(editorUser.id);

            const response = await request(app)
                .delete("/api/v1/permissions/1")
                .set("Authorization", `Bearer ${token}`)
                .expect(403);

            expect(response.body).toMatchObject({
                success: false,
            });
        });
    });

    describe("Authorization and Authentication Edge Cases", () => {
        it("should handle malformed JWT token", async () => {
            const response = await request(app)
                .get("/api/v1/permissions")
                .set("Authorization", "Bearer invalid-token")
                .expect(401);

            expect(response.body).toMatchObject({
                success: false,
            });
        });

        it("should handle expired JWT token", async () => {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error("JWT_SECRET environment variable is not set");
            }

            const expiredToken = jwt.sign(
                {
                    sub: "1",
                    jti: "test-jti",
                },
                jwtSecret,
                { expiresIn: "-1h" }, // Expired token
            );

            const response = await request(app)
                .get("/api/v1/permissions")
                .set("Authorization", `Bearer ${expiredToken}`)
                .expect(401);

            expect(response.body).toMatchObject({
                success: false,
            });
        });

        it("should handle missing Authorization header", async () => {
            const response = await request(app).get("/api/v1/permissions").expect(401);

            expect(response.body).toMatchObject({
                success: false,
            });
        });

        it("should handle user without any roles", async () => {
            // Create a user without assigning any role
            const userWithoutRole = await rbacSeeder.createTestUser({
                email: "norole@test.com",
                password: "password123",
            });

            const token = createTestJWT(userWithoutRole.id);

            const response = await request(app)
                .get("/api/v1/permissions")
                .set("Authorization", `Bearer ${token}`)
                .expect(403);

            expect(response.body).toMatchObject({
                success: false,
            });
        });
    });
});
