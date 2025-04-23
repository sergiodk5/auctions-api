import { Request, Response } from "express-serve-static-core";
import { db } from "@/config/database";
import { usersTable } from "@/db/usersSchema";
import { eq } from "drizzle-orm";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/config/env";

async function registerUser(req: Request, res: Response) {
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

        const [user] = await db.insert(usersTable).values(data).returning();

        if (!user) {
            res.status(400).json({
                success: false,
                data: null,
                message: "Failed to create user"
            });

            return;
        }

        delete (user as { password?: string }).password;

        res.status(201).json({
            success: true,
            data: user,
            message: "User created successfully"
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to create user"
        });
    }
}

async function loginUser(req: Request, res: Response) {
    const { email, password } = req.body.cleanBody;

    try {
        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email));

        if (!user) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Authentication failed"
            });

            return;
        }

        const matched = await bcrypt.compare(password, user.password);

        if (!matched) {
            res.status(401).json({
                success: false,
                data: null,
                message: "Authentication failed"
            });

            return;
        }

        delete (user as { password?: string }).password;

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            success: true,
            data: { ...user, token },
            message: "User fetched successfully"
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            data: null,
            message: "Failed to login user"
        });
    }
}

export default {
    registerUser,
    loginUser,
}
