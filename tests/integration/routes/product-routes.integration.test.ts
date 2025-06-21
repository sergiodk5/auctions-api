import app from "@/app";
import request from "supertest";
import { authTestHelper } from "../../helpers/auth.helper";
import { cleanupTestDatabase, closeTestDatabase, setupTestDatabase } from "../../helpers/database.helper";
import { seedRBACForTest } from "../../helpers/rbac-seeder.helper";

describe("Product Routes", () => {
    let db: ReturnType<typeof setupTestDatabase>;
    let adminUser: any;
    let adminToken: string;

    beforeAll(async () => {
        // Setup the test database
        db = setupTestDatabase();

        // Clean up database and seed RBAC data using transactional approach
        await cleanupTestDatabase();
        await seedRBACForTest(db);

        // Create admin user with authentication
        const adminAuth = await authTestHelper.createAdminUser(`admin-${Date.now()}@test.com`);
        adminUser = adminAuth.user;
        adminToken = adminAuth.token;
    });

    afterAll(async () => {
        await cleanupTestDatabase();
        closeTestDatabase();
    });

    it("should fetch all products", async () => {
        const response = await request(app).get("/api/v1/products").set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Get all products");
    });

    it("should create a new product", async () => {
        const response = await request(app).post("/api/v1/products").set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Create a new product");
    });

    it("should fetch a product by ID", async () => {
        const response = await request(app).get("/api/v1/products/1").set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Get product with ID: 1");
    });

    it("should update a product by ID", async () => {
        const response = await request(app).put("/api/v1/products/1").set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Update product with ID: 1");
    });

    it("should delete a product by ID", async () => {
        const response = await request(app).delete("/api/v1/products/1").set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.text).toBe("Delete product with ID: 1");
    });
});
