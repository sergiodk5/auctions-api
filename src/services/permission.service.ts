import { TYPES } from "@/di/types";
import type { IPermissionRepository } from "@/repositories/permission.repository";
import { CreatePermissionDto, Permission, UpdatePermissionDto } from "@/types/permissions";
import { inject, injectable } from "inversify";

export interface IPermissionService {
    getAllPermissions(): Promise<Permission[]>;
    getPermissionById(id: number): Promise<Permission>;
    getPermissionByName(name: string): Promise<Permission>;
    createPermission(data: CreatePermissionDto): Promise<Permission>;
    updatePermission(id: number, data: UpdatePermissionDto): Promise<Permission>;
    deletePermission(id: number): Promise<void>;
}

@injectable()
export default class PermissionService implements IPermissionService {
    constructor(@inject(TYPES.IPermissionRepository) private readonly permissionRepo: IPermissionRepository) {}

    async getAllPermissions(): Promise<Permission[]> {
        return this.permissionRepo.findAll();
    }

    async getPermissionById(id: number): Promise<Permission> {
        const permission = await this.permissionRepo.findById(id);
        if (!permission) throw new Error("PermissionNotFound");
        return permission;
    }

    async getPermissionByName(name: string): Promise<Permission> {
        const permission = await this.permissionRepo.findByName(name);
        if (!permission) throw new Error("PermissionNotFound");
        return permission;
    }

    async createPermission(data: CreatePermissionDto): Promise<Permission> {
        const existing = await this.permissionRepo.findByName(data.name);
        if (existing) throw new Error("PermissionExists");
        return this.permissionRepo.create(data);
    }

    async updatePermission(id: number, data: UpdatePermissionDto): Promise<Permission> {
        const permission = await this.permissionRepo.update(id, data);
        if (!permission) throw new Error("PermissionNotFound");
        return permission;
    }

    async deletePermission(id: number): Promise<void> {
        const deleted = await this.permissionRepo.delete(id);
        if (!deleted) throw new Error("PermissionNotFound");
    }
}
