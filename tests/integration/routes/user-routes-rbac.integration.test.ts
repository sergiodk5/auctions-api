import app from "@/app";
import request from "supertest";
import { createAuthToken } from "../../helpers/auth.helper";
import { cleanupTestDatabase, setupTestDatabase } from "../../helpers/database.helper";
import { getTestRBACSeeder, RoleName, seedRBACForTest } from "../../helpers/rbac-seeder.helper";

describe("User Routes with RBAC", () => {
    let db: NonNullable<ReturnType<typeof setupTestDatabase>>;
    let rbacSeeder: ReturnType<typeof getTestRBACSeeder>;
    let adminUser: any;
    let editorUser: any;
    let clientUser: any;
    let adminToken: string;
    let editorToken: string;
    let clientToken: string;

    beforeAll(async () => {
        // Ensure NODE_ENV is set to test for proper database selection
        process.env.NODE_ENV = "test";

        const testDb = setupTestDatabase();
        if (!testDb) {
            throw new Error("Failed to setup test database");
        }
        db = testDb;

        // Create test seeder instance using the test database connection
        rbacSeeder = getTestRBACSeeder(db);

        // First clean up all database tables
        await cleanupTestDatabase();

        // Then seed RBAC data using the new transactional approach
        await seedRBACForTest(db);

        // Create test users with unique emails for this test run
        const timestamp = Date.now();
        adminUser = await rbacSeeder.createTestUser(
            {
                email: `admin-${timestamp}@test.com`,
                password: "password123",
            },
            RoleName.ADMIN,
        );

        editorUser = await rbacSeeder.createTestUser(
            {
                email: `editor-${timestamp}@test.com`,
                password: "password123",
            },
            RoleName.EDITOR,
        );

        clientUser = await rbacSeeder.createTestUser(
            {
                email: `client-${timestamp}@test.com`,
                password: "password123",
            },
            RoleName.CLIENT,
        );

        // Generate JWT tokens for each user
        adminToken = createAuthToken(adminUser.id);
        editorToken = createAuthToken(editorUser.id);
        clientToken = createAuthToken(clientUser.id);
    });

    // Removed afterAll cleanup as it was running immediately after beforeAll
    // and deleting user roles before tests could run. The cleanup will happen
    // in the next test's beforeAll.

    describe("GET /users - List all users", () => {
        it("should allow admin to list users", async () => {
            const response = await request(app).get("/users").set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        it("should allow editor to list users", async () => {
            const response = await request(app).get("/users").set("Authorization", `Bearer ${editorToken}`);

            expect(response.status).toBe(200);
        });

        it("should allow client to list users", async () => {
            const response = await request(app).get("/users").set("Authorization", `Bearer ${clientToken}`);

            expect(response.status).toBe(200);
        });

        it("should deny access without authentication", async () => {
            const response = await request(app).get("/users");

            expect(response.status).toBe(401);
        });
    });

    describe("POST /users - Create new user", () => {
        // Generate a unique email for each test run
        const timestamp = Date.now();
        const newUserData = {
            email: `newuser-${timestamp}@test.com`,
            password: "password123",
        };

        it("should allow admin to create users", async () => {
            const response = await request(app)
                .post("/users")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(newUserData);

            expect(response.status).toBe(201);
        });

        it("should deny editor access to create users", async () => {
            const response = await request(app)
                .post("/users")
                .set("Authorization", `Bearer ${editorToken}`)
                .send(newUserData);

            expect(response.status).toBe(403);
        });

        it("should deny client access to create users", async () => {
            const response = await request(app)
                .post("/users")
                .set("Authorization", `Bearer ${clientToken}`)
                .send(newUserData);

            expect(response.status).toBe(403);
        });

        it("should deny access without authentication", async () => {
            const response = await request(app).post("/users").send(newUserData);

            expect(response.status).toBe(401);
        });

        it("should validate user data and return 400 for invalid data", async () => {
            // Send invalid data (missing password)
            const response = await request(app).post("/users").set("Authorization", `Bearer ${adminToken}`).send({
                email: "valid@test.com",
                // Missing password field
            });

            expect(response.status).toBe(400);
        });
    });

    describe("GET /users/:id - Get user by ID", () => {
        it("should allow admin to get user by ID", async () => {
            const response = await request(app)
                .get(`/users/${adminUser.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });

        it("should allow editor to get user by ID", async () => {
            const response = await request(app)
                .get(`/users/${editorUser.id}`)
                .set("Authorization", `Bearer ${editorToken}`);

            expect(response.status).toBe(200);
        });

        it("should allow client to get user by ID", async () => {
            const response = await request(app)
                .get(`/users/${clientUser.id}`)
                .set("Authorization", `Bearer ${clientToken}`);

            expect(response.status).toBe(200);
        });

        it("should return 404 for non-existent user", async () => {
            // Use a very large ID that likely doesn't exist
            const nonExistentId = 9999999;

            const response = await request(app)
                .get(`/users/${nonExistentId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe("PUT /users/:id - Update user", () => {
        const timestamp = Date.now();
        const updateData = {
            email: `updated-${timestamp}@test.com`,
        };

        it("should allow admin to update users", async () => {
            // Create a user to update
            const userToUpdate = await rbacSeeder.createTestUser({
                email: `toupdate-${timestamp}@test.com`,
                password: "password123",
            });

            const response = await request(app)
                .put(`/users/${userToUpdate.id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
        });

        it("should deny editor access to update users", async () => {
            const response = await request(app)
                .put(`/users/${editorUser.id}`)
                .set("Authorization", `Bearer ${editorToken}`)
                .send(updateData);

            expect(response.status).toBe(403);
        });

        it("should deny client access to update users", async () => {
            const response = await request(app)
                .put(`/users/${clientUser.id}`)
                .set("Authorization", `Bearer ${clientToken}`)
                .send(updateData);

            expect(response.status).toBe(403);
        });

        it("should return 404 for non-existent user", async () => {
            const response = await request(app)
                .put("/users/99999")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(404);
        });
    });

    describe("DELETE /users/:id - Delete user", () => {
        it("should allow admin to delete users", async () => {
            // Create a user to delete with unique email using timestamp
            const timestamp = Date.now();
            const userToDelete = await rbacSeeder.createTestUser({
                email: `todelete-${timestamp}@test.com`,
                password: "password123",
            });

            // Make sure the user exists before trying to delete
            expect(userToDelete).toBeDefined();
            expect(userToDelete.id).toBeDefined();

            const response = await request(app)
                .delete(`/users/${userToDelete.id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("User deleted successfully");
        });

        it("should deny editor access to delete users", async () => {
            const response = await request(app)
                .delete(`/users/${editorUser.id}`)
                .set("Authorization", `Bearer ${editorToken}`);

            expect(response.status).toBe(403);
        });

        it("should deny client access to delete users", async () => {
            const response = await request(app)
                .delete(`/users/${clientUser.id}`)
                .set("Authorization", `Bearer ${clientToken}`);

            expect(response.status).toBe(403);
        });

        it("should return 404 for non-existent user", async () => {
            // Use a very large ID that likely doesn't exist
            const nonExistentId = 9999999;

            const response = await request(app)
                .delete(`/users/${nonExistentId}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("User not found");
        });

        it("should deny access without authentication", async () => {
            const response = await request(app).delete("/users/1");

            expect(response.status).toBe(401);
        });
    });
});
