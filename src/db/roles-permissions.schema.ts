import { usersTable } from "@/db/users.schema";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const rolesTable = pgTable("roles", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 100 }).notNull().unique(), // e.g. 'admin'
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const permissionsTable = pgTable("permissions", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 100 }).notNull().unique(), // e.g. 'user:create'
    description: varchar("description", { length: 255 }),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const rolePermissionsTable = pgTable("role_permissions", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    role_id: integer("role_id")
        .notNull()
        .references(() => rolesTable.id),
    permission_id: integer("permission_id")
        .notNull()
        .references(() => permissionsTable.id),
});

export const userRolesTable = pgTable("user_roles", {
    user_id: integer("user_id")
        .notNull()
        .references(() => usersTable.id),
    role_id: integer("role_id")
        .notNull()
        .references(() => rolesTable.id),
});
