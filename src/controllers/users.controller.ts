import { TYPES } from "@/di/types";
import type { IUserRoleRepository } from "@/repositories/user-role.repository";
import type { IUserService } from "@/services/user.service.ts";
import { CreateUserDto, UpdateUserDto } from "@/types/user";
import { Request, Response } from "express-serve-static-core";
import { inject, injectable } from "inversify";

export interface IUsersController {
    getAllUsers(req: Request, res: Response): Promise<void>;
    getUserById(req: Request, res: Response): Promise<void>;
    createUser(req: Request, res: Response): Promise<void>;
    updateUser(req: Request, res: Response): Promise<void>;
    deleteUser(req: Request, res: Response): Promise<void>;
    getUserRoles(req: Request, res: Response): Promise<void>;
    assignUserRoles(req: Request, res: Response): Promise<void>;
    removeUserRole(req: Request, res: Response): Promise<void>;
}

@injectable()
export default class UsersController implements IUsersController {
    constructor(
        @inject(TYPES.IUserService) private readonly userService: IUserService,
        @inject(TYPES.IUserRoleRepository) private readonly userRoleRepository: IUserRoleRepository,
    ) {}

    async getAllUsers(_req: Request, res: Response): Promise<void> {
        try {
            const users = await this.userService.getAllUsers();
            res.status(200).json({ success: true, data: users });
        } catch {
            res.status(500).json({ success: false, message: "Failed to fetch users" });
        }
    }

    async getUserById(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: "Invalid user ID" });
            return;
        }
        try {
            const user = await this.userService.getUserById(id);
            res.status(200).json({ success: true, data: user });
        } catch (e) {
            res.status(404).json({ success: false, message: "User not found" });
        }
    }

    async createUser(req: Request, res: Response): Promise<void> {
        const data = req.body.cleanBody.body as CreateUserDto;
        try {
            const user = await this.userService.createUser(data);
            res.status(201).json({ success: true, data: user });
        } catch (e) {
            // @ts-expect-error: TypeScript doesn't know about the custom error
            if (e.message === "UserExists") {
                res.status(409).json({ success: false, message: "Email already exists" });
            } else {
                res.status(500).json({ success: false, message: "Failed to create user" });
            }
        }
    }

    async updateUser(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: "Invalid user ID" });
            return;
        }
        const data = req.body.cleanBody.body as UpdateUserDto;
        try {
            const user = await this.userService.updateUser(id, data);
            res.status(200).json({ success: true, data: user });
        } catch (e) {
            res.status(404).json({ success: false, message: "User not found" });
        }
    }

    async deleteUser(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: "Invalid user ID" });
            return;
        }
        try {
            await this.userService.deleteUser(id);
            res.status(200).json({ success: true, message: "User deleted successfully" });
        } catch (e) {
            res.status(404).json({ success: false, message: "User not found" });
        }
    }

    async getUserRoles(req: Request, res: Response): Promise<void> {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.status(400).json({ success: false, message: "Invalid user ID" });
            return;
        }

        try {
            const roles = await this.userRoleRepository.getRoles(userId);
            res.json({
                success: true,
                message: "User roles retrieved successfully",
                data: roles,
            });
        } catch (error) {
            console.error("Error getting user roles:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve user roles",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async assignUserRoles(req: Request, res: Response): Promise<void> {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.status(400).json({ success: false, message: "Invalid user ID" });
            return;
        }

        const { role_ids } = req.body.cleanBody.body;
        if (!Array.isArray(role_ids) || role_ids.length === 0) {
            res.status(400).json({
                success: false,
                message: "role_ids must be a non-empty array",
            });
            return;
        }

        const roleIds = role_ids.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
        if (roleIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "No valid role IDs provided",
            });
            return;
        }

        try {
            // Check if user exists
            await this.userService.getUserById(userId);

            await this.userRoleRepository.assignRoles(userId, roleIds);
            res.json({
                success: true,
                message: "Roles assigned to user successfully",
            });
        } catch (error) {
            console.error("Error assigning roles to user:", error);
            if (error instanceof Error && error.message === "UserNotFound") {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to assign roles to user",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }

    async removeUserRole(req: Request, res: Response): Promise<void> {
        const userId = parseInt(req.params.id, 10);
        const roleId = parseInt(req.params.roleId, 10);

        if (isNaN(userId) || isNaN(roleId)) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID or role ID",
            });
            return;
        }

        try {
            // Check if user exists
            await this.userService.getUserById(userId);

            await this.userRoleRepository.removeRoles(userId, [roleId]);
            res.json({
                success: true,
                message: "Role removed from user successfully",
            });
        } catch (error) {
            console.error("Error removing role from user:", error);
            if (error instanceof Error && error.message === "UserNotFound") {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Failed to remove role from user",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }
}
