import { permissionsTable, rolePermissionsTable, rolesTable } from "@/db/roles-permissions.schema";
import { TYPES } from "@/di/types";
import { type IDatabaseService } from "@/services/database.service";
import {
    AssignRolePermissionDto,
    CreateRoleDto,
    Permission,
    Role,
    RoleWithPermissions,
    UpdateRoleDto,
} from "@/types/permissions";
import { and, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

export interface IRoleRepository {
    findAll(): Promise<Role[]>;
    findById(id: number): Promise<Role | undefined>;
    findByName(name: string): Promise<Role | undefined>;
    findByIdWithPermissions(id: number): Promise<RoleWithPermissions | undefined>;
    findAllWithPermissions(): Promise<RoleWithPermissions[]>;
    create(data: CreateRoleDto): Promise<Role>;
    update(id: number, data: UpdateRoleDto): Promise<Role | undefined>;
    delete(id: number): Promise<boolean>;
    assignPermission(data: AssignRolePermissionDto): Promise<void>;
    removePermission(roleId: number, permissionId: number): Promise<boolean>;
    hasPermission(roleId: number, permissionName: string): Promise<boolean>;
    setPermissions(roleId: number, permissionIds: number[]): Promise<void>;
    getPermissions(roleId: number): Promise<Permission[]>;
}

@injectable()
export default class RoleRepository implements IRoleRepository {
    constructor(@inject(TYPES.IDatabaseService) private readonly databaseService: IDatabaseService) {}

    async findAll(): Promise<Role[]> {
        const roles = await this.databaseService.db
            .select({
                id: rolesTable.id,
                name: rolesTable.name,
                created_at: rolesTable.created_at,
                updated_at: rolesTable.updated_at,
            })
            .from(rolesTable);
        return roles;
    }

    async findById(id: number): Promise<Role | undefined> {
        const [role] = await this.databaseService.db
            .select({
                id: rolesTable.id,
                name: rolesTable.name,
                created_at: rolesTable.created_at,
                updated_at: rolesTable.updated_at,
            })
            .from(rolesTable)
            .where(eq(rolesTable.id, id));
        return role;
    }

    async findByName(name: string): Promise<Role | undefined> {
        const [role] = await this.databaseService.db
            .select({
                id: rolesTable.id,
                name: rolesTable.name,
                created_at: rolesTable.created_at,
                updated_at: rolesTable.updated_at,
            })
            .from(rolesTable)
            .where(eq(rolesTable.name, name));
        return role;
    }

    async findByIdWithPermissions(id: number): Promise<RoleWithPermissions | undefined> {
        // Get the role first
        const role = await this.findById(id);
        if (!role) return undefined;

        // Get associated permissions
        const permissions = await this.databaseService.db
            .select({
                id: permissionsTable.id,
                name: permissionsTable.name,
                description: permissionsTable.description,
                created_at: permissionsTable.created_at,
                updated_at: permissionsTable.updated_at,
            })
            .from(permissionsTable)
            .innerJoin(rolePermissionsTable, eq(permissionsTable.id, rolePermissionsTable.permission_id))
            .where(eq(rolePermissionsTable.role_id, id));

        return {
            ...role,
            permissions,
        };
    }

    async findAllWithPermissions(): Promise<RoleWithPermissions[]> {
        const roles = await this.findAll();
        const rolesWithPermissions: RoleWithPermissions[] = [];

        for (const role of roles) {
            const permissions = await this.databaseService.db
                .select({
                    id: permissionsTable.id,
                    name: permissionsTable.name,
                    description: permissionsTable.description,
                    created_at: permissionsTable.created_at,
                    updated_at: permissionsTable.updated_at,
                })
                .from(permissionsTable)
                .innerJoin(rolePermissionsTable, eq(permissionsTable.id, rolePermissionsTable.permission_id))
                .where(eq(rolePermissionsTable.role_id, role.id));

            rolesWithPermissions.push({
                ...role,
                permissions,
            });
        }

        return rolesWithPermissions;
    }

    async create(data: CreateRoleDto): Promise<Role> {
        const [role] = await this.databaseService.db.insert(rolesTable).values({ name: data.name }).returning({
            id: rolesTable.id,
            name: rolesTable.name,
            created_at: rolesTable.created_at,
            updated_at: rolesTable.updated_at,
        });
        return role;
    }

    async update(id: number, data: UpdateRoleDto): Promise<Role | undefined> {
        const [role] = await this.databaseService.db
            .update(rolesTable)
            .set({
                ...data,
                updated_at: new Date(),
            })
            .where(eq(rolesTable.id, id))
            .returning({
                id: rolesTable.id,
                name: rolesTable.name,
                created_at: rolesTable.created_at,
                updated_at: rolesTable.updated_at,
            });
        return role;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.databaseService.db
            .delete(rolesTable)
            .where(eq(rolesTable.id, id))
            .returning({ id: rolesTable.id });

        return result.length > 0;
    }

    async assignPermission(data: AssignRolePermissionDto): Promise<void> {
        await this.databaseService.db
            .insert(rolePermissionsTable)
            .values({
                role_id: data.role_id,
                permission_id: data.permission_id,
            })
            .onConflictDoNothing();
    }

    async removePermission(roleId: number, permissionId: number): Promise<boolean> {
        const result = await this.databaseService.db
            .delete(rolePermissionsTable)
            .where(and(eq(rolePermissionsTable.role_id, roleId), eq(rolePermissionsTable.permission_id, permissionId)))
            .returning({ id: rolePermissionsTable.id });

        return result.length > 0;
    }

    async hasPermission(roleId: number, permissionName: string): Promise<boolean> {
        const [result] = await this.databaseService.db
            .select({ count: permissionsTable.id })
            .from(permissionsTable)
            .innerJoin(rolePermissionsTable, eq(permissionsTable.id, rolePermissionsTable.permission_id))
            .where(and(eq(rolePermissionsTable.role_id, roleId), eq(permissionsTable.name, permissionName)))
            .limit(1);

        return !!result;
    }

    async setPermissions(roleId: number, permissionIds: number[]): Promise<void> {
        // Start a transaction to ensure atomicity
        await this.databaseService.db.transaction(async (tx) => {
            // First, remove all existing permissions for this role
            await tx.delete(rolePermissionsTable).where(eq(rolePermissionsTable.role_id, roleId));

            // Then, insert the new permissions (if any)
            if (permissionIds.length > 0) {
                const values = permissionIds.map((permissionId) => ({
                    role_id: roleId,
                    permission_id: permissionId,
                }));

                await tx.insert(rolePermissionsTable).values(values);
            }
        });
    }

    async getPermissions(roleId: number): Promise<Permission[]> {
        const permissions = await this.databaseService.db
            .select({
                id: permissionsTable.id,
                name: permissionsTable.name,
                description: permissionsTable.description,
                created_at: permissionsTable.created_at,
                updated_at: permissionsTable.updated_at,
            })
            .from(permissionsTable)
            .innerJoin(rolePermissionsTable, eq(permissionsTable.id, rolePermissionsTable.permission_id))
            .where(eq(rolePermissionsTable.role_id, roleId));

        return permissions;
    }
}
