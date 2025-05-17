import { usersTable } from "@/db/users.schema";
import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const refreshFamiliesTable = pgTable("refresh_families", {
    familyId: uuid("family_id").primaryKey().defaultRandom(),
    userId: integer("user_id")
        .notNull()
        .references(() => usersTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    absoluteExpiry: timestamp("absolute_expiry").notNull(),
});

export const refreshTokensTable = pgTable("refresh_tokens", {
    jti: uuid("jti").primaryKey(),
    familyId: uuid("family_id")
        .notNull()
        .references(() => refreshFamiliesTable.familyId),
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    revokedAt: timestamp("revoked_at"),
});
