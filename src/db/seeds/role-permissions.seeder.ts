import { DATABASE_URL, NODE_ENV, TEST_DATABASE_URL } from "@/config/env";
import { permissionsTable, rolePermissionsTable, rolesTable } from "@/db/roles-permissions.schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = NODE_ENV === "test" ? TEST_DATABASE_URL : DATABASE_URL;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

export async function rolePermissionsSeeder() {
    // Get all roles and permissions from the database
    const roles = await db.select().from(rolesTable);
    const permissions = await db.select().from(permissionsTable);

    // Create maps for easy lookup
    const roleMap = new Map(roles.map((role) => [role.name, role.id]));
    const permissionMap = new Map(permissions.map((permission) => [permission.name, permission.id]));

    const rolePermissions = [];

    // 1. Admin gets all permissions
    const adminId = roleMap.get("admin");
    if (adminId) {
        for (const permission of permissions) {
            rolePermissions.push({
                role_id: adminId,
                permission_id: permission.id,
            });
        }
    }

    // 2. Editor gets all product permissions + user:read
    const editorId = roleMap.get("editor");
    if (editorId) {
        const editorPermissionNames = [
            "product:read",
            "product:create",
            "product:update",
            "product:delete",
            "user:read",
        ];

        for (const permissionName of editorPermissionNames) {
            const permissionId = permissionMap.get(permissionName);
            if (permissionId) {
                rolePermissions.push({
                    role_id: editorId,
                    permission_id: permissionId,
                });
            }
        }
    }

    // 3. Client gets all product permissions
    const clientId = roleMap.get("client");
    if (clientId) {
        const clientPermissionNames = ["product:read", "product:create", "product:update", "product:delete"];

        for (const permissionName of clientPermissionNames) {
            const permissionId = permissionMap.get(permissionName);
            if (permissionId) {
                rolePermissions.push({
                    role_id: clientId,
                    permission_id: permissionId,
                });
            }
        }
    }

    // Insert all role-permission mappings
    if (rolePermissions.length > 0) {
        await db.insert(rolePermissionsTable).values(rolePermissions).onConflictDoNothing();
    }
}
