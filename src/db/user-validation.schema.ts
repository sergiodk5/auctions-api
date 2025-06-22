import { z } from "zod";

// User route validation schemas - wrapped for middleware
export const createUserRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        emailVerified: z.boolean().optional(),
        emailVerifiedAt: z.date().optional().nullable(),
    }),
});

export const updateUserRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format").optional(),
        password: z.string().min(8, "Password must be at least 8 characters").optional(),
        emailVerified: z.boolean().optional(),
        emailVerifiedAt: z.date().optional().nullable(),
    }),
});

export const loginRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
    }),
});

// Auth route validation schemas for authentication.route.ts
export const registerRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        emailVerified: z.boolean().optional(),
        emailVerifiedAt: z.date().optional().nullable(),
    }),
});

export const authLoginRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
    }),
});

export const forgotPasswordRouteSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
    }),
});

export const resetPasswordRouteSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Token is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
    }),
});

export const emailVerificationRouteSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Token is required"),
    }),
});
