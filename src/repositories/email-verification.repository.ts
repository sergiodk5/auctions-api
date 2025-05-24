import { emailVerificationTable } from "@/db/email-verification.schema";
import { TYPES } from "@/di/types";
import type { IDatabaseService } from "@/services/database.service";
import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

export interface IEmailVerificationRepository {
    create(userId: number, token: string): Promise<void>;
    findByToken(token: string): Promise<{ id: number; userId: number } | null>;
    markAsVerified(id: number): Promise<void>;
    deleteByUserId(userId: number): Promise<void>;
}

@injectable()
export class EmailVerificationRepository implements IEmailVerificationRepository {
    constructor(@inject(TYPES.IDatabaseService) private readonly databaseService: IDatabaseService) {}

    public async create(userId: number, token: string): Promise<void> {
        await this.databaseService.db.insert(emailVerificationTable).values({
            userId,
            token,
        });
    }

    public async findByToken(token: string): Promise<{ id: number; userId: number } | null> {
        const result = await this.databaseService.db
            .select({
                id: emailVerificationTable.id,
                userId: emailVerificationTable.userId,
            })
            .from(emailVerificationTable)
            .where(and(eq(emailVerificationTable.token, token), isNull(emailVerificationTable.verifiedAt)))
            .limit(1);

        return result[0] || null;
    }

    public async markAsVerified(id: number): Promise<void> {
        await this.databaseService.db
            .update(emailVerificationTable)
            .set({ verifiedAt: new Date() })
            .where(eq(emailVerificationTable.id, id));
    }

    public async deleteByUserId(userId: number): Promise<void> {
        await this.databaseService.db.delete(emailVerificationTable).where(eq(emailVerificationTable.userId, userId));
    }
}
