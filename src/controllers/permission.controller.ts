import { TYPES } from "@/di/types";
import type { IPermissionService } from "@/services/permission.service";
import { CreatePermissionDto, UpdatePermissionDto } from "@/types/permissions";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

export interface IPermissionController {
    getAllPermissions(req: Request, res: Response): Promise<void>;
    getPermissionById(req: Request, res: Response): Promise<void>;
    createPermission(req: Request, res: Response): Promise<void>;
    updatePermission(req: Request, res: Response): Promise<void>;
    deletePermission(req: Request, res: Response): Promise<void>;
}

@injectable()
export default class PermissionController implements IPermissionController {
    constructor(@inject(TYPES.IPermissionService) private readonly permissionService: IPermissionService) {}

    async getAllPermissions(req: Request, res: Response): Promise<void> {
        try {
            const permissions = await this.permissionService.getAllPermissions();
            res.json({
                success: true,
                message: "Permissions retrieved successfully",
                data: permissions,
            });
        } catch (error) {
            console.error("Error getting all permissions:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve permissions",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getPermissionById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid permission ID",
                });
                return;
            }

            const permission = await this.permissionService.getPermissionById(id);
            res.json({
                success: true,
                message: "Permission retrieved successfully",
                data: permission,
            });
        } catch (error) {
            console.error("Error getting permission by ID:", error);
            if (error instanceof Error && error.message === "PermissionNotFound") {
                res.status(404).json({
                    success: false,
                    message: "Permission not found",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to retrieve permission",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }

    async createPermission(req: Request, res: Response): Promise<void> {
        try {
            const permissionData: CreatePermissionDto = req.body;
            const permission = await this.permissionService.createPermission(permissionData);

            res.status(201).json({
                success: true,
                message: "Permission created successfully",
                data: permission,
            });
        } catch (error) {
            console.error("Error creating permission:", error);
            if (error instanceof Error && error.message === "PermissionExists") {
                res.status(409).json({
                    success: false,
                    message: "Permission with this name already exists",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to create permission",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }

    async updatePermission(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid permission ID",
                });
                return;
            }

            const updateData: UpdatePermissionDto = req.body;
            const permission = await this.permissionService.updatePermission(id, updateData);

            res.json({
                success: true,
                message: "Permission updated successfully",
                data: permission,
            });
        } catch (error) {
            console.error("Error updating permission:", error);
            if (error instanceof Error && error.message === "PermissionNotFound") {
                res.status(404).json({
                    success: false,
                    message: "Permission not found",
                });
            } else if (error instanceof Error && error.message === "PermissionExists") {
                res.status(409).json({
                    success: false,
                    message: "Permission with this name already exists",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to update permission",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }

    async deletePermission(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid permission ID",
                });
                return;
            }

            await this.permissionService.deletePermission(id);

            res.json({
                success: true,
                message: "Permission deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting permission:", error);
            if (error instanceof Error && error.message === "PermissionNotFound") {
                res.status(404).json({
                    success: false,
                    message: "Permission not found",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to delete permission",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }
}
