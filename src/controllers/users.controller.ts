import { Request, Response } from "express-serve-static-core";
import { db } from "@/config/database";
import { usersTable } from "@/db/usersSchema";
import { eq } from "drizzle-orm";

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

async function getUserByEmail(req: Request, res: Response) {
    const email = req.params.email;
    if (!email) {
        res.status(400).json({
            success: false,
            data: null,
            message: "Invalid user email"
        });

        return;
    }

    try {
        const users = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email));

        if (!users.length) {
            res.status(404).json({
                success: false,
                data: null,
                message: "User not found"
            });

            return;
        }

        res.status(200).json({
            success: true,
            data: users[0],
            message: "User fetched successfully"
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to fetch user"
        });
    }
}

async function createUser(req: Request, res: Response) {
    try {
        const results = await db.insert(usersTable).values(req.body.cleanBody).returning();

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
    } else {
        try {
            const results = await db
                .delete(usersTable)
                .where(eq(usersTable.id, userId))
                .returning();

            if (!results.length) {
                return res.status(404).json({
                    success: false,
                    data: null,
                    message: "User not found"
                });
            } else {
                res.status(200).json({
                    success: true,
                    data: null,
                    message: "User deleted successfully"
                });
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            res.status(500).json({
                success: false,
                data: null,
                message: "Failed to delete user"
            });
        }
    }
}

export default {
    getAllUsers,
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    deleteUser,
}