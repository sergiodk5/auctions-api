import { pgTable, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const usersTable = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
});

export const createUserSchema = createInsertSchema(usersTable);
export const updateUserSchema = createInsertSchema(usersTable).partial();
export const loginSchema = createInsertSchema(usersTable)
    .pick({
        email: true,
        password: true,
    })
    .strict();
