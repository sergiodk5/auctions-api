import { TYPES } from "@/di/types";
import type { IRoleRepository } from "@/repositories/role.repository";
import { AssignRolePermissionDto, CreateRoleDto, Role, RoleWithPermissions, UpdateRoleDto } from "@/types/permissions";
import { inject, injectable } from "inversify";

export interface IRoleService {
    getAllRoles(): Promise<Role[]>;
    getAllRolesWithPermissions(): Promise<RoleWithPermissions[]>;
    getRoleById(id: number): Promise<Role>;
    getRoleByIdWithPermissions(id: number): Promise<RoleWithPermissions>;
    getRoleByName(name: string): Promise<Role>;
    createRole(data: CreateRoleDto): Promise<Role>;
    updateRole(id: number, data: UpdateRoleDto): Promise<Role>;
    deleteRole(id: number): Promise<void>;
    assignPermissionToRole(data: AssignRolePermissionDto): Promise<void>;
    removePermissionFromRole(roleId: number, permissionId: number): Promise<void>;
    setRolePermissions(roleId: number, permissionIds: number[]): Promise<void>;
}

@injectable()
export default class RoleService implements IRoleService {
    constructor(@inject(TYPES.IRoleRepository) private readonly roleRepo: IRoleRepository) {}

    async getAllRoles(): Promise<Role[]> {
        return this.roleRepo.findAll();
    }

    async getAllRolesWithPermissions(): Promise<RoleWithPermissions[]> {
        return this.roleRepo.findAllWithPermissions();
    }

    async getRoleById(id: number): Promise<Role> {
        const role = await this.roleRepo.findById(id);
        if (!role) throw new Error("RoleNotFound");
        return role;
    }

    async getRoleByIdWithPermissions(id: number): Promise<RoleWithPermissions> {
        const role = await this.roleRepo.findByIdWithPermissions(id);
        if (!role) throw new Error("RoleNotFound");
        return role;
    }

    async getRoleByName(name: string): Promise<Role> {
        const role = await this.roleRepo.findByName(name);
        if (!role) throw new Error("RoleNotFound");
        return role;
    }

    async createRole(data: CreateRoleDto): Promise<Role> {
        const existing = await this.roleRepo.findByName(data.name);
        if (existing) throw new Error("RoleExists");
        return this.roleRepo.create(data);
    }

    async updateRole(id: number, data: UpdateRoleDto): Promise<Role> {
        // Check if role exists
        const existingRole = await this.roleRepo.findById(id);
        if (!existingRole) throw new Error("RoleNotFound");

        // Check if new name conflicts with another role
        if (data.name && data.name !== existingRole.name) {
            const nameConflict = await this.roleRepo.findByName(data.name);
            if (nameConflict) throw new Error("RoleExists");
        }

        const role = await this.roleRepo.update(id, data);
        if (!role) throw new Error("RoleNotFound");
        return role;
    }

    async deleteRole(id: number): Promise<void> {
        const deleted = await this.roleRepo.delete(id);
        if (!deleted) throw new Error("RoleNotFound");
    }

    async assignPermissionToRole(data: AssignRolePermissionDto): Promise<void> {
        // Verify role exists
        const role = await this.roleRepo.findById(data.role_id);
        if (!role) throw new Error("RoleNotFound");

        return this.roleRepo.assignPermission(data);
    }

    async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
        const removed = await this.roleRepo.removePermission(roleId, permissionId);
        if (!removed) throw new Error("RolePermissionNotFound");
    }

    async setRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
        // Verify role exists
        const role = await this.roleRepo.findById(roleId);
        if (!role) throw new Error("RoleNotFound");

        return this.roleRepo.setPermissions(roleId, permissionIds);
    }
}
