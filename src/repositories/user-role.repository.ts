import { rolesTable, userRolesTable } from "@/db/rbac.schema";
import { TYPES } from "@/di/types";
import { type IDatabaseService } from "@/services/database.service";
import { Role } from "@/types/permissions";
import { and, eq, inArray } from "drizzle-orm";
import { inject, injectable } from "inversify";

export interface IUserRoleRepository {
    assignRoles(userId: number, roleIds: number[]): Promise<void>;
    removeRoles(userId: number, roleIds: number[]): Promise<void>;
    getRoles(userId: number): Promise<Role[]>;
}

@injectable()
export default class UserRoleRepository implements IUserRoleRepository {
    constructor(@inject(TYPES.IDatabaseService) private readonly databaseService: IDatabaseService) {}

    async assignRoles(userId: number, roleIds: number[]): Promise<void> {
        if (roleIds.length === 0) {
            return;
        }

        // Check which roles are not already assigned
        const existingRoles = await this.databaseService.db
            .select({
                role_id: userRolesTable.role_id,
            })
            .from(userRolesTable)
            .where(and(eq(userRolesTable.user_id, userId), inArray(userRolesTable.role_id, roleIds)));

        const existingRoleIds = new Set(existingRoles.map((r) => r.role_id));
        const newRoleIds = roleIds.filter((roleId) => !existingRoleIds.has(roleId));

        if (newRoleIds.length > 0) {
            const userRoleData = newRoleIds.map((roleId) => ({
                user_id: userId,
                role_id: roleId,
            }));

            await this.databaseService.db.insert(userRolesTable).values(userRoleData);
        }
    }

    async removeRoles(userId: number, roleIds: number[]): Promise<void> {
        if (roleIds.length === 0) {
            return;
        }

        await this.databaseService.db
            .delete(userRolesTable)
            .where(and(eq(userRolesTable.user_id, userId), inArray(userRolesTable.role_id, roleIds)));
    }

    async getRoles(userId: number): Promise<Role[]> {
        const roles = await this.databaseService.db
            .select({
                id: rolesTable.id,
                name: rolesTable.name,
                created_at: rolesTable.created_at,
                updated_at: rolesTable.updated_at,
            })
            .from(userRolesTable)
            .innerJoin(rolesTable, eq(userRolesTable.role_id, rolesTable.id))
            .where(eq(userRolesTable.user_id, userId));

        return roles;
    }
}
