import { permissionsTable, rolePermissionsTable, userRolesTable } from "@/db/roles-permissions.schema";
import { TYPES } from "@/di/types";
import { type ICacheService } from "@/services/cache.service";
import { type IDatabaseService } from "@/services/database.service";
import { Permission } from "@/types/permissions";
import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

export interface IUserPermissionRepository {
    getPermissions(userId: number, options?: { useCache?: boolean }): Promise<Permission[]>;
    invalidateUserPermissions(userId: number): Promise<void>;
    invalidateAllUserPermissions(): Promise<void>;
}

@injectable()
export default class UserPermissionRepository implements IUserPermissionRepository {
    private readonly CACHE_TTL = 300; // 5 minutes in seconds
    private readonly CACHE_KEY_PREFIX = "permissions:user:";

    constructor(
        @inject(TYPES.IDatabaseService) private readonly databaseService: IDatabaseService,
        @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
    ) {}

    async getPermissions(userId: number, options: { useCache?: boolean } = {}): Promise<Permission[]> {
        const { useCache = true } = options;
        const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}`;

        // Try to get from cache first if caching is enabled
        if (useCache) {
            try {
                const cachedPermissions = await this.cacheService.client.get(cacheKey);
                if (cachedPermissions) {
                    return JSON.parse(cachedPermissions) as Permission[];
                }
            } catch (error: unknown) {
                console.warn("Failed to get permissions from cache:", error);
                // Continue with database query if cache fails
            }
        }

        // Get permissions from database
        const permissions = await this.fetchPermissionsFromDatabase(userId);

        // Cache the result if caching is enabled
        if (useCache) {
            try {
                await this.cacheService.client.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(permissions));
            } catch (error: unknown) {
                console.warn("Failed to cache permissions:", error);
                // Don't fail the request if caching fails
            }
        }

        return permissions;
    }

    private async fetchPermissionsFromDatabase(userId: number): Promise<Permission[]> {
        const permissions = await this.databaseService.db
            .selectDistinct({
                id: permissionsTable.id,
                name: permissionsTable.name,
                description: permissionsTable.description,
                created_at: permissionsTable.created_at,
                updated_at: permissionsTable.updated_at,
            })
            .from(userRolesTable)
            .innerJoin(rolePermissionsTable, eq(userRolesTable.role_id, rolePermissionsTable.role_id))
            .innerJoin(permissionsTable, eq(rolePermissionsTable.permission_id, permissionsTable.id))
            .where(eq(userRolesTable.user_id, userId));

        return permissions;
    }

    /**
     * Invalidates cached permissions for a specific user
     * Useful when user roles or role permissions are updated
     */
    async invalidateUserPermissions(userId: number): Promise<void> {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}`;
        try {
            await this.cacheService.client.del(cacheKey);
        } catch (error: unknown) {
            console.warn("Failed to invalidate user permissions cache:", error);
        }
    }

    /**
     * Invalidates all cached user permissions
     * Useful when permissions or role-permission mappings are updated globally
     */
    async invalidateAllUserPermissions(): Promise<void> {
        try {
            const keys = await this.cacheService.client.keys(`${this.CACHE_KEY_PREFIX}*`);
            if (keys.length > 0) {
                await this.cacheService.client.del(keys);
            }
        } catch (error: unknown) {
            console.warn("Failed to invalidate all user permissions cache:", error);
        }
    }
}
