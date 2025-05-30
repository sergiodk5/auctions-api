import { TYPES } from "@/di/types";
import type { IRoleRepository } from "@/repositories/role.repository";
import type { IUserPermissionRepository } from "@/repositories/user-permission.repository";
import type { IUserRoleRepository } from "@/repositories/user-role.repository";
import { Permission } from "@/types/permissions";
import { inject, injectable } from "inversify";

export interface IAuthorizationService {
    /**
     * Check if a user has a specific permission
     */
    hasPermission(userId: number, permissionName: string): Promise<boolean>;

    /**
     * Check if a user has any of the specified permissions
     */
    hasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean>;

    /**
     * Check if a user has all of the specified permissions
     */
    hasAllPermissions(userId: number, permissionNames: string[]): Promise<boolean>;

    /**
     * Check if a user has a specific role
     */
    hasRole(userId: number, roleName: string): Promise<boolean>;

    /**
     * Check if a user has any of the specified roles
     */
    hasAnyRole(userId: number, roleNames: string[]): Promise<boolean>;

    /**
     * Check if a user has all of the specified roles
     */
    hasAllRoles(userId: number, roleNames: string[]): Promise<boolean>;

    /**
     * Get all permissions for a user
     */
    getUserPermissions(userId: number, options?: { useCache?: boolean }): Promise<Permission[]>;

    /**
     * Get all role names for a user
     */
    getUserRoles(userId: number): Promise<string[]>;

    /**
     * Check if a user can perform a specific action on a resource
     * This is a higher-level method that can be customized for specific business logic
     */
    can(userId: number, action: string, resource?: string): Promise<boolean>;

    /**
     * Invalidate authorization cache for a user
     */
    invalidateUserCache(userId: number): Promise<void>;
}

@injectable()
export default class AuthorizationService implements IAuthorizationService {
    constructor(
        @inject(TYPES.IUserPermissionRepository)
        private readonly userPermissionRepo: IUserPermissionRepository,
        @inject(TYPES.IUserRoleRepository)
        private readonly userRoleRepo: IUserRoleRepository,
        @inject(TYPES.IRoleRepository)
        private readonly roleRepo: IRoleRepository,
    ) {}

    async hasPermission(userId: number, permissionName: string): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        return permissions.some((permission) => permission.name === permissionName);
    }

    async hasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        const userPermissionNames = permissions.map((p) => p.name);
        return permissionNames.some((permissionName) => userPermissionNames.includes(permissionName));
    }

    async hasAllPermissions(userId: number, permissionNames: string[]): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        const userPermissionNames = permissions.map((p) => p.name);
        return permissionNames.every((permissionName) => userPermissionNames.includes(permissionName));
    }

    async hasRole(userId: number, roleName: string): Promise<boolean> {
        const userRoles = await this.getUserRoles(userId);
        return userRoles.includes(roleName);
    }

    async hasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
        const userRoles = await this.getUserRoles(userId);
        return roleNames.some((roleName) => userRoles.includes(roleName));
    }

    async hasAllRoles(userId: number, roleNames: string[]): Promise<boolean> {
        const userRoles = await this.getUserRoles(userId);
        return roleNames.every((roleName) => userRoles.includes(roleName));
    }

    async getUserPermissions(userId: number, options?: { useCache?: boolean }): Promise<Permission[]> {
        return this.userPermissionRepo.getPermissions(userId, options);
    }

    async getUserRoles(userId: number): Promise<string[]> {
        const roles = await this.userRoleRepo.getRoles(userId);
        return roles.map((role) => role.name);
    }

    async can(userId: number, action: string, resource?: string): Promise<boolean> {
        // Build permission name based on action and resource
        // This follows a common pattern: action:resource or just action
        const permissionName = resource ? `${action}:${resource}` : action;

        // First check if user has the specific permission
        if (await this.hasPermission(userId, permissionName)) {
            return true;
        }

        // Check for wildcard permissions
        const wildcardPermission = resource ? `${action}:*` : action;
        if (await this.hasPermission(userId, wildcardPermission)) {
            return true;
        }

        // Check for admin role (admins can do everything)
        if (await this.hasRole(userId, "admin")) {
            return true;
        }

        return false;
    }

    async invalidateUserCache(userId: number): Promise<void> {
        await this.userPermissionRepo.invalidateUserPermissions(userId);
    }
}
