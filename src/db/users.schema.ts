import { boolean, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const usersTable = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at"),
});

export const createUserSchema = createInsertSchema(usersTable);
export const updateUserSchema = createInsertSchema(usersTable).partial();
export const loginSchema = createInsertSchema(usersTable)
    .pick({
        email: true,
        password: true,
    })
    .strict();

// Forgot-password payload
export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

// Reset-password payload
export const resetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(8),
});

// Email verification payload
export const emailVerificationSchema = z.object({
    token: z.string(),
});
