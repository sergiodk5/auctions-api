import { Request, Response } from "express-serve-static-core";
import { db } from "@/config/database";
import { usersTable } from "@/db/usersSchema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function getAllUsers(_req: Request, res: Response) {
    try {
        const users = await db.select().from(usersTable);

        res.status(200).json({
            success: true,
            data: users,
            message: "Users fetched successfully"
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to fetch users"
        });
    }
}

async function getUserById(req: Request, res: Response) {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        res.status(400).json({
            success: false,
            data: null,
            message: "Invalid user ID"
        });
    } else {
        try {
            const users = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.id, userId));

            if (!users.length) {
                res.status(404).json({
                    success: false,
                    data: null,
                    message: "User not found"
                });
            } else {
                res.status(200).json({
                    success: true,
                    data: users[0],
                    message: "User fetched successfully"
                });
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({
                success: false,
                data: null,
                message: "Failed to fetch user"
            });
        }
    }
}

async function createUser(req: Request, res: Response) {
    try {
        const data = req.body.cleanBody;
        const existingUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, data.email));

        if (existingUser.length) {
            res.status(409).json({
                success: false,
                data: null,
                message: "User with this email already exists"
            });

            return;
        }

        data.password = await bcrypt.hash(data.password, 10);

        const results = await db.insert(usersTable).values(data).returning();

        if (!results.length) {
            res.status(400).json({
                success: false,
                data: null,
                message: "Failed to create user"
            });
        } else {
            res.status(201).json({
                success: true,
                data: results[0],
                message: "User created successfully"
            });
        }
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to create user"
        });
    }
}

async function updateUser(req: Request, res: Response) {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        res.status(400).json({
            success: false,
            data: null,
            message: "Invalid user ID"
        });
    } else {
        try {
            const results = await db
                .update(usersTable)
                .set(req.body.cleanBody)
                .where(eq(usersTable.id, userId))
                .returning();

            if (!results.length) {
                res.status(404).json({
                    success: false,
                    data: null,
                    message: "User not found"
                });
            } else {
                res.status(200).json({
                    success: true,
                    data: results[0],
                    message: "User updated successfully"
                });
            }
        } catch (error) {
            console.error("Error updating user:", error);
            res.status(500).json({
                success: false,
                data: null,
                message: "Failed to update user"
            });
        }
    }
}

async function deleteUser(req: Request, res: Response) {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        res.status(400).json({
            success: false,
            data: null,
            message: "Invalid user ID"
        });

        return;
    }

    try {
        const results = await db
            .delete(usersTable)
            .where(eq(usersTable.id, userId))
            .returning();

        if (!results.length) {
            res.status(404).json({
                success: false,
                data: null,
                message: "User not found"
            });

            return;
        }

        res.status(200).json({
            success: true,
            data: null,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to delete user"
        });
    }
}

export default {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
}