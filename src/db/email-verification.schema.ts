import { usersTable } from "@/db/users.schema";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const emailVerificationTable = pgTable("email_verification", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
        .notNull()
        .references(() => usersTable.id),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    verifiedAt: timestamp("verified_at"),
});
