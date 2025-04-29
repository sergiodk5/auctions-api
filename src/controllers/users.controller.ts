import { Request, Response } from "express-serve-static-core";
import { UserService } from "@/services/user.service";
import { UserRepository } from "@/repositories/UserRepository";
import { CreateUserDto, UpdateUserDto } from "@/types/user";

const userService = new UserService(new UserRepository());

export class UsersController {
    async getAllUsers(_req: Request, res: Response): Promise<void> {
        try {
            const users = await userService.getAllUsers();
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
            const user = await userService.getUserById(id);
            res.status(200).json({ success: true, data: user });
        } catch (e) {
            res.status(404).json({ success: false, message: "User not found" });
        }
    }

    async createUser(req: Request, res: Response): Promise<void> {
        const data = req.body.cleanBody as CreateUserDto;
        try {
            const user = await userService.createUser(data);
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
        const data = req.body.cleanBody as UpdateUserDto;
        try {
            const user = await userService.updateUser(id, data);
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
            await userService.deleteUser(id);
            res.status(200).json({ success: true, message: "User deleted successfully" });
        } catch (e) {
            res.status(404).json({ success: false, message: "User not found" });
        }
    }
}

export default new UsersController();
