import redisClient from "@/config/redisClient";
import { db } from "@/config/database";
import { refreshFamiliesTable, refreshTokensTable } from "@/db/tokensSchema";
import { eq, isNull, and } from "drizzle-orm";
import { ITokenRepository } from "./ITokenRepository";
import { REFRESH_IDLE_TTL, REFRESH_ABSOLUTE_TTL } from "@/config/env";

export class TokenRepository implements ITokenRepository {
    async storeRefreshToken(jti: string, familyId: string): Promise<void> {
        await redisClient
            .multi()
            .set(`refresh:jti:${jti}`, familyId, { EX: REFRESH_IDLE_TTL })
            .sAdd(`refresh:family:${familyId}`, jti)
            .expire(`refresh:family:${familyId}`, REFRESH_ABSOLUTE_TTL)
            .exec();

        await db
            .insert(refreshFamiliesTable)
            .values({
                familyId,
                userId: null as any,
                absoluteExpiry: new Date(Date.now() + REFRESH_ABSOLUTE_TTL * 1000),
            })
            .onConflictDoNothing();

        await db.insert(refreshTokensTable).values({ jti, familyId });
    }

    async revokeRefreshToken(jti: string): Promise<void> {
        await redisClient.del(`refresh:jti:${jti}`);

        await db.update(refreshTokensTable).set({ revokedAt: new Date() }).where(eq(refreshTokensTable.jti, jti));
    }

    async revokeFamily(familyId: string): Promise<void> {
        const rows = await db
            .select({ jti: refreshTokensTable.jti })
            .from(refreshTokensTable)
            .where(eq(refreshTokensTable.familyId, familyId));

        const multi = redisClient.multi();

        rows.forEach(({ jti }) => multi.del(`refresh:jti:${jti}`));
        multi.del(`refresh:family:${familyId}`);
        await multi.exec();

        await db
            .update(refreshTokensTable)
            .set({ revokedAt: new Date() })
            .where(and(eq(refreshTokensTable.familyId, familyId), isNull(refreshTokensTable.revokedAt)));
    }

    async isRefreshTokenValid(jti: string): Promise<boolean> {
        return !!(await redisClient.get(`refresh:jti:${jti}`));
    }

    async addToDenyList(jti: string, ttlSeconds: number): Promise<void> {
        await redisClient.set(`denylist:jti:${jti}`, "true", { EX: ttlSeconds });
    }

    async isAccessTokenRevoked(jti: string): Promise<boolean> {
        return !!(await redisClient.get(`denylist:jti:${jti}`));
    }
}
