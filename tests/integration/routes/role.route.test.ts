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

describe("Role Routes Integration Tests", () => {
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

    describe("GET /api/v1/roles", () => {
        it("should get all roles for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                    emailVerified: true,
                },
                RoleName.ADMIN,
            );
            const token = createTestJWT(adminUser.id, "admin-get-roles");

            const response = await request(app)
                .get("/api/v1/roles")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data).toHaveLength(3);

            const roleNames = response.body.data.map((role: { name: string }) => role.name);
            expect(roleNames).toContain("admin");
            expect(roleNames).toContain("editor");
            expect(roleNames).toContain("client");
        });

        it("should deny access for non-admin user", async () => {
            const editorUser = await rbacSeeder.createTestUser(
                {
                    email: "editor@test.com",
                    password: "password123",
                    emailVerified: true,
                },
                RoleName.EDITOR,
            );
            const token = createTestJWT(editorUser.id, "editor-access-denied");

            const response = await request(app)
                .get("/api/v1/roles")
                .set("Authorization", `Bearer ${token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Insufficient role privileges");
        });

        it("should deny access without authentication", async () => {
            const response = await request(app).get("/api/v1/roles").expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /api/v1/roles/:id", () => {
        it("should get role by id for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                    emailVerified: true,
                },
                RoleName.ADMIN,
            );
            const token = createTestJWT(adminUser.id, "admin-get-role-by-id");

            const response = await request(app)
                .get("/api/v1/roles/1?include_permissions=true")
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(1);
            expect(response.body.data.name).toBe("admin");
            expect(response.body.data.permissions).toBeInstanceOf(Array);
        });

        it("should return 404 for non-existent role", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                    emailVerified: true,
                },
                RoleName.ADMIN,
            );
            const token = createTestJWT(adminUser.id, "admin-role-not-found");

            const response = await request(app)
                .get("/api/v1/roles/999")
                .set("Authorization", `Bearer ${token}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Role not found");
        });
    });

    describe("POST /api/v1/roles", () => {
        it("should create new role for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                    emailVerified: true,
                },
                RoleName.ADMIN,
            );
            const token = createTestJWT(adminUser.id, "admin-create-role");

            const newRole = {
                name: "moderator",
            };

            const response = await request(app)
                .post("/api/v1/roles")
                .set("Authorization", `Bearer ${token}`)
                .send(newRole)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe("moderator");
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.created_at).toBeDefined();
            expect(response.body.data.updated_at).toBeDefined();
        });

        it("should return 409 for duplicate role name", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                    emailVerified: true,
                },
                RoleName.ADMIN,
            );
            const token = createTestJWT(adminUser.id, "admin-duplicate-role");

            const duplicateRole = {
                name: "admin",
            };

            const response = await request(app)
                .post("/api/v1/roles")
                .set("Authorization", `Bearer ${token}`)
                .send(duplicateRole)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("already exists");
        });
    });

    describe("PUT /api/v1/roles/:id", () => {
        it("should update role for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                    emailVerified: true,
                },
                RoleName.ADMIN,
            );
            const token = createTestJWT(adminUser.id, "admin-update-role");

            const updatedRole = {
                name: "super-admin",
            };

            const response = await request(app)
                .put("/api/v1/roles/1")
                .set("Authorization", `Bearer ${token}`)
                .send(updatedRole)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe("super-admin");
        });
    });

    describe("DELETE /api/v1/roles/:id", () => {
        it("should delete role for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                    emailVerified: true,
                },
                RoleName.ADMIN,
            );
            const token = createTestJWT(adminUser.id, "admin-delete-role");

            // First create a role to delete
            const newRole = {
                name: "temp-role",
            };

            const createResponse = await request(app)
                .post("/api/v1/roles")
                .set("Authorization", `Bearer ${token}`)
                .send(newRole)
                .expect(201);

            const roleId = createResponse.body.data.id;

            // Now delete it
            const response = await request(app)
                .delete(`/api/v1/roles/${roleId}`)
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain("deleted successfully");
        });
    });

    describe("POST /api/v1/roles/:id/permissions/:permissionId", () => {
        it("should assign permission to role for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                    emailVerified: true,
                },
                RoleName.ADMIN,
            );
            const token = createTestJWT(adminUser.id, "admin-assign-permission");

            // Assign a permission that's not already assigned
            const response = await request(app)
                .post("/api/v1/roles/3/permissions") // client role
                .set("Authorization", `Bearer ${token}`)
                .send({ permission_id: 1 }) // user:create permission
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain("Permission assigned");
        });
    });

    describe("DELETE /api/v1/roles/:id/permissions/:permissionId", () => {
        it("should remove permission from role for admin user", async () => {
            const adminUser = await rbacSeeder.createTestUser(
                {
                    email: "admin@test.com",
                    password: "password123",
                    emailVerified: true,
                },
                RoleName.ADMIN,
            );
            const token = createTestJWT(adminUser.id, "admin-remove-permission");

            // Remove a permission that's assigned to admin
            const response = await request(app)
                .delete("/api/v1/roles/1/permissions/1") // admin role, user:create permission
                .set("Authorization", `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain("Permission removed");
        });
    });
});
