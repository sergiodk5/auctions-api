import { TYPES } from "@/di/types";
import type { ILoggerService } from "@/services/logger.service";
import type { IRoleService } from "@/services/role.service";
import { AssignRolePermissionDto, CreateRoleDto, UpdateRoleDto } from "@/types/permissions";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

export interface IRoleController {
    getAllRoles(req: Request, res: Response): Promise<void>;
    getRoleById(req: Request, res: Response): Promise<void>;
    createRole(req: Request, res: Response): Promise<void>;
    updateRole(req: Request, res: Response): Promise<void>;
    deleteRole(req: Request, res: Response): Promise<void>;
    assignPermissionToRole(req: Request, res: Response): Promise<void>;
    removePermissionFromRole(req: Request, res: Response): Promise<void>;
    setRolePermissions(req: Request, res: Response): Promise<void>;
}

@injectable()
export default class RoleController implements IRoleController {
    constructor(
        @inject(TYPES.IRoleService) private readonly roleService: IRoleService,
        @inject(TYPES.ILoggerService) private readonly logger: ILoggerService,
    ) {}

    async getAllRoles(req: Request, res: Response): Promise<void> {
        try {
            const includePermissions = req.query.include_permissions === "true";

            if (includePermissions) {
                const roles = await this.roleService.getAllRolesWithPermissions();
                res.json({
                    success: true,
                    message: "Roles retrieved successfully",
                    data: roles,
                });
            } else {
                const roles = await this.roleService.getAllRoles();
                res.json({
                    success: true,
                    message: "Roles retrieved successfully",
                    data: roles,
                });
            }
        } catch (error) {
            this.logger.error("Error getting all roles:", { error });
            res.status(500).json({
                success: false,
                message: "Failed to retrieve roles",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getRoleById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid role ID",
                });
                return;
            }

            const includePermissions = req.query.include_permissions === "true";

            if (includePermissions) {
                const role = await this.roleService.getRoleByIdWithPermissions(id);
                res.json({
                    success: true,
                    message: "Role retrieved successfully",
                    data: role,
                });
            } else {
                const role = await this.roleService.getRoleById(id);
                res.json({
                    success: true,
                    message: "Role retrieved successfully",
                    data: role,
                });
            }
        } catch (error) {
            this.logger.error("Error getting role by ID:", { error });
            if (error instanceof Error && error.message === "RoleNotFound") {
                res.status(404).json({
                    success: false,
                    message: "Role not found",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to retrieve role",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }

    async createRole(req: Request, res: Response): Promise<void> {
        try {
            const roleData: CreateRoleDto = req.body;
            const role = await this.roleService.createRole(roleData);

            res.status(201).json({
                success: true,
                message: "Role created successfully",
                data: role,
            });
        } catch (error) {
            this.logger.error("Error creating role:", { error });
            if (error instanceof Error && error.message === "RoleExists") {
                res.status(409).json({
                    success: false,
                    message: "Role with this name already exists",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to create role",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }

    async updateRole(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid role ID",
                });
                return;
            }

            const updateData: UpdateRoleDto = req.body;
            const role = await this.roleService.updateRole(id, updateData);

            res.json({
                success: true,
                message: "Role updated successfully",
                data: role,
            });
        } catch (error) {
            this.logger.error("Error updating role:", { error });
            if (error instanceof Error && error.message === "RoleNotFound") {
                res.status(404).json({
                    success: false,
                    message: "Role not found",
                });
            } else if (error instanceof Error && error.message === "RoleExists") {
                res.status(409).json({
                    success: false,
                    message: "Role with this name already exists",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to update role",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }

    async deleteRole(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid role ID",
                });
                return;
            }

            await this.roleService.deleteRole(id);

            res.json({
                success: true,
                message: "Role deleted successfully",
            });
        } catch (error) {
            this.logger.error("Error deleting role:", { error });
            if (error instanceof Error && error.message === "RoleNotFound") {
                res.status(404).json({
                    success: false,
                    message: "Role not found",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to delete role",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }

    async assignPermissionToRole(req: Request, res: Response): Promise<void> {
        try {
            const roleId = parseInt(req.params.id);
            const { permission_id } = req.body;

            if (isNaN(roleId) || !permission_id) {
                res.status(400).json({
                    success: false,
                    message: "Invalid role ID or permission ID",
                });
                return;
            }

            const data: AssignRolePermissionDto = {
                role_id: roleId,
                permission_id: parseInt(permission_id),
            };

            await this.roleService.assignPermissionToRole(data);

            res.json({
                success: true,
                message: "Permission assigned to role successfully",
            });
        } catch (error) {
            this.logger.error("Error assigning permission to role:", { error });
            if (error instanceof Error && error.message === "RoleNotFound") {
                res.status(404).json({
                    success: false,
                    message: "Role not found",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to assign permission to role",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }

    async removePermissionFromRole(req: Request, res: Response): Promise<void> {
        try {
            const roleId = parseInt(req.params.id);
            const permissionId = parseInt(req.params.permissionId);

            if (isNaN(roleId) || isNaN(permissionId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid role ID or permission ID",
                });
                return;
            }

            await this.roleService.removePermissionFromRole(roleId, permissionId);

            res.json({
                success: true,
                message: "Permission removed from role successfully",
            });
        } catch (error) {
            this.logger.error("Error removing permission from role:", { error });
            if (error instanceof Error && error.message === "RolePermissionNotFound") {
                res.status(404).json({
                    success: false,
                    message: "Role permission association not found",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to remove permission from role",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }

    async setRolePermissions(req: Request, res: Response): Promise<void> {
        try {
            const roleId = parseInt(req.params.id);
            const { permission_ids } = req.body;

            if (isNaN(roleId) || !Array.isArray(permission_ids)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid role ID or permission IDs array",
                });
                return;
            }

            const permissionIds = permission_ids.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));

            await this.roleService.setRolePermissions(roleId, permissionIds);

            res.json({
                success: true,
                message: "Role permissions updated successfully",
            });
        } catch (error) {
            this.logger.error("Error setting role permissions:", { error });
            if (error instanceof Error && error.message === "RoleNotFound") {
                res.status(404).json({
                    success: false,
                    message: "Role not found",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to update role permissions",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }
}
