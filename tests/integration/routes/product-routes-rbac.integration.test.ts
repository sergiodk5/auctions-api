import app from "@/app";
import request from "supertest";
import { createAuthToken } from "../../helpers/auth.helper";
import { cleanupTestDatabase, closeTestDatabase, setupTestDatabase } from "../../helpers/database.helper";
import { getTestRBACSeeder, RoleName, seedRBACForTest } from "../../helpers/rbac-seeder.helper";
import { configureTestApp } from "../../helpers/test-app.helper";

describe("Product Routes with RBAC", () => {
    let db: ReturnType<typeof setupTestDatabase>;
    let rbacSeeder: ReturnType<typeof getTestRBACSeeder>;
    let adminUser: any;
    let editorUser: any;
    let clientUser: any;
    let adminToken: string;
    let editorToken: string;
    let clientToken: string;

    beforeAll(async () => {
        // Set the TEST_DATABASE_URL environment variable
        process.env.TEST_DATABASE_URL = "postgres://postgres:postgres@localhost:5435/postgres_test";

        db = setupTestDatabase();
        if (!db) {
            throw new Error("Failed to setup test database");
        }

        // Configure the app to use the test database connection
        configureTestApp();

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

    afterAll(async () => {
        // Make sure to clean up thoroughly after tests
        await cleanupTestDatabase();

        // Close the database connection properly
        if (db) {
            closeTestDatabase();
        }
    });

    describe("GET /api/v1/products - List all products", () => {
        it("should allow admin to access products", async () => {
            const response = await request(app).get("/api/v1/products").set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Get all products");
        });

        it("should allow editor to access products", async () => {
            const response = await request(app).get("/api/v1/products").set("Authorization", `Bearer ${editorToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Get all products");
        });

        it("should allow client to access products", async () => {
            const response = await request(app).get("/api/v1/products").set("Authorization", `Bearer ${clientToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Get all products");
        });

        it("should deny access without authentication", async () => {
            const response = await request(app).get("/api/v1/products");

            expect(response.status).toBe(401);
        });

        it("should deny access with invalid token", async () => {
            const response = await request(app).get("/api/v1/products").set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/v1/products - Create new product", () => {
        it("should allow admin to create products", async () => {
            const response = await request(app).post("/api/v1/products").set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Create a new product");
        });

        it("should allow editor to create products", async () => {
            const response = await request(app).post("/api/v1/products").set("Authorization", `Bearer ${editorToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Create a new product");
        });

        it("should deny client from creating products", async () => {
            const response = await request(app).post("/api/v1/products").set("Authorization", `Bearer ${clientToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Insufficient permissions");
        });

        it("should deny access without authentication", async () => {
            const response = await request(app).post("/api/v1/products");

            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/v1/products/:id - Get product by ID", () => {
        it("should allow admin to get product by ID", async () => {
            const response = await request(app).get("/api/v1/products/1").set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Get product with ID: 1");
        });

        it("should allow editor to get product by ID", async () => {
            const response = await request(app).get("/api/v1/products/1").set("Authorization", `Bearer ${editorToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Get product with ID: 1");
        });

        it("should allow client to get product by ID", async () => {
            const response = await request(app).get("/api/v1/products/1").set("Authorization", `Bearer ${clientToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Get product with ID: 1");
        });
    });

    describe("PUT /api/v1/products/:id - Update product", () => {
        it("should allow admin to update products", async () => {
            const response = await request(app).put("/api/v1/products/1").set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Update product with ID: 1");
        });

        it("should allow editor to update products", async () => {
            const response = await request(app).put("/api/v1/products/1").set("Authorization", `Bearer ${editorToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Update product with ID: 1");
        });

        it("should deny client from updating products", async () => {
            const response = await request(app).put("/api/v1/products/1").set("Authorization", `Bearer ${clientToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Insufficient permissions");
        });

        it("should deny access without authentication", async () => {
            const response = await request(app).put("/api/v1/products/1");

            expect(response.status).toBe(401);
        });
    });

    describe("DELETE /api/v1/products/:id - Delete product", () => {
        it("should allow admin to delete products", async () => {
            const response = await request(app)
                .delete("/api/v1/products/1")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Delete product with ID: 1");
        });

        it("should allow editor to delete products", async () => {
            const response = await request(app)
                .delete("/api/v1/products/1")
                .set("Authorization", `Bearer ${editorToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toBe("Delete product with ID: 1");
        });

        it("should deny client from deleting products", async () => {
            const response = await request(app)
                .delete("/api/v1/products/1")
                .set("Authorization", `Bearer ${clientToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Insufficient permissions");
        });

        it("should deny access without authentication", async () => {
            const response = await request(app).delete("/api/v1/products/1");

            expect(response.status).toBe(401);
        });
    });
});
