import { JWT_SECRET } from "@/config/env";
import { Request, Response, NextFunction } from "express-serve-static-core";
import jwt from "jsonwebtoken";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        res.status(403).json({
            success: false,
            data: null,
            message: "Access denied - no token provided",
        });

        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("typeof decoded:", typeof decoded);
        console.log("Decoded token:", decoded);
        if (typeof decoded !== "object" || !decoded?.id) {
            res.status(403).json({
                success: false,
                data: null,
                message: "Access denied - not an object or missing id",
            });

            return;
        }

        next();
    } catch (error) {
        console.error("Token verification error:", error);
        res.status(403).json({
            success: false,
            data: null,
            message: "Access denied - invalid token 500",
        });
    }
}