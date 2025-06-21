import { eq } from "drizzle-orm";
import { permissionsTable, rolesTable, userRolesTable } from "../../../src/db/rbac.schema";
import { cleanupTestDatabase, closeTestDatabase, setupTestDatabase } from "../../helpers/database.helper";
import { getTestRBACSeeder, seedRBACForTest, type RoleName } from "../../helpers/rbac-seeder.helper";

// Generate unique email for test cases
const generateUniqueEmail = (base: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    return `${base}-${timestamp}-${randomString}@test.com`;
};

describe("RBAC Seeder Helper", () => {
    let db: NonNullable<ReturnType<typeof setupTestDatabase>>;
    let testRbacSeeder: ReturnType<typeof getTestRBACSeeder>;

    beforeAll(async () => {
        const dbInstance = setupTestDatabase();
        if (!dbInstance) {
            throw new Error("Failed to setup test database");
        }
        db = dbInstance;
        // Create test seeder instance that uses the same db connection as tests
        testRbacSeeder = getTestRBACSeeder(db);
        await cleanupTestDatabase();
    });

    afterAll(async () => {
        await cleanupTestDatabase();
        closeTestDatabase();
    });

    beforeEach(async () => {
        await cleanupTestDatabase();
        await testRbacSeeder.cleanupRBACTables();
    });

    describe("transactional seeding", () => {
        it("should create all RBAC data in a single transaction", async () => {
            // Use the new transactional seeding approach
            await seedRBACForTest(db);

            // Verify roles
            const roles = await db.select().from(rolesTable);
            expect(roles).toHaveLength(3);

            const roleNames = roles.map((role) => role.name);
            expect(roleNames).toContain("admin");
            expect(roleNames).toContain("editor");
            expect(roleNames).toContain("client");

            // Verify permissions
            const permissions = await db.select().from(permissionsTable);
            expect(permissions.length).toBeGreaterThan(0);

            const permissionNames = permissions.map((perm) => perm.name);
            expect(permissionNames).toContain("user:create");
            expect(permissionNames).toContain("product:read");
        });

        it("should not create duplicates when called multiple times", async () => {
            // Seed once
            await seedRBACForTest(db);
            const rolesAfterFirst = await db.select().from(rolesTable);
            const permissionsAfterFirst = await db.select().from(permissionsTable);

            // Seed again
            await seedRBACForTest(db);
            const rolesAfterSecond = await db.select().from(rolesTable);
            const permissionsAfterSecond = await db.select().from(permissionsTable);

            // Should have same counts (no duplicates)
            expect(rolesAfterSecond).toHaveLength(rolesAfterFirst.length);
            expect(permissionsAfterSecond).toHaveLength(permissionsAfterFirst.length);
        });
    });

    describe("seedRoles", () => {
        it("should create all required roles", async () => {
            await testRbacSeeder.seedRoles();

            const roles = await db.select().from(rolesTable);
            expect(roles).toHaveLength(3);

            const roleNames = roles.map((role) => role.name);
            expect(roleNames).toContain("admin");
            expect(roleNames).toContain("editor");
            expect(roleNames).toContain("client");
        });
    });

    describe("seedPermissions", () => {
        it("should create all required permissions", async () => {
            await testRbacSeeder.seedPermissions();

            const permissions = await db.select().from(permissionsTable);
            expect(permissions).toHaveLength(9); // Updated count to match actual permissions

            const permissionNames = permissions.map((p) => p.name);
            expect(permissionNames).toContain("user:create");
            expect(permissionNames).toContain("user:read");
            expect(permissionNames).toContain("user:update");
            expect(permissionNames).toContain("user:delete");
            expect(permissionNames).toContain("product:create");
            expect(permissionNames).toContain("product:read");
            expect(permissionNames).toContain("product:update");
            expect(permissionNames).toContain("product:delete");
            expect(permissionNames).toContain("role:manage");
        });
    });

    describe("createTestUser", () => {
        it("should create user with assigned role", async () => {
            // Use transactional seeding to ensure all RBAC data is available
            await seedRBACForTest(db);

            const baseEmail = "admin@test.com";
            const testUser = await testRbacSeeder.createTestUser(
                {
                    email: baseEmail,
                    password: "password123",
                },
                "admin" as RoleName,
            );

            expect(testUser.id).toBeDefined();
            expect(testUser.email).toContain("admin");
            expect(testUser.email).toContain("@test.com");

            // Verify user has admin role
            const userRoles = await db
                .select({
                    name: rolesTable.name,
                })
                .from(userRolesTable)
                .innerJoin(rolesTable, eq(userRolesTable.role_id, rolesTable.id))
                .where(eq(userRolesTable.user_id, testUser.id));

            expect(userRoles).toHaveLength(1);
            expect(userRoles[0].name).toBe("admin");
        });
    });
});
