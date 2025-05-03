import { inject, injectable } from "inversify";
import { refreshFamiliesTable, refreshTokensTable } from "@/db/tokensSchema";
import { eq, isNull, and } from "drizzle-orm";
import { REFRESH_IDLE_TTL, REFRESH_ABSOLUTE_TTL } from "@/config/env";
import { TYPES } from "@/di/types";
import { type IDatabaseService } from "@/services/database.service";
import { type ICacheService } from "@/services/cache.service";

export interface ITokenRepository {
    storeRefreshToken(jti: string, familyId: string): Promise<void>;
    revokeRefreshToken(jti: string): Promise<void>;
    revokeFamily(familyId: string): Promise<void>;
    isRefreshTokenValid(jti: string): Promise<boolean>;
    addToDenyList(jti: string, ttlSeconds: number): Promise<void>;
    isAccessTokenRevoked(jti: string): Promise<boolean>;
}

@injectable()
export default class TokenRepository implements ITokenRepository {
    constructor(
        @inject(TYPES.IDatabaseService) private readonly databaseService: IDatabaseService,
        @inject(TYPES.ICacheService) private readonly cacheService: ICacheService,
    ) {}

    async storeRefreshToken(jti: string, familyId: string): Promise<void> {
        await this.cacheService.client
            .multi()
            .set(`refresh:jti:${jti}`, familyId, { EX: REFRESH_IDLE_TTL })
            .sAdd(`refresh:family:${familyId}`, jti)
            .expire(`refresh:family:${familyId}`, REFRESH_ABSOLUTE_TTL)
            .exec();

        await this.databaseService.db
            .insert(refreshFamiliesTable)
            .values({
                familyId,
                userId: null as any,
                absoluteExpiry: new Date(Date.now() + REFRESH_ABSOLUTE_TTL * 1000),
            })
            .onConflictDoNothing();

        await this.databaseService.db.insert(refreshTokensTable).values({ jti, familyId });
    }

    async revokeRefreshToken(jti: string): Promise<void> {
        await this.cacheService.client.del(`refresh:jti:${jti}`);

        await this.databaseService.db
            .update(refreshTokensTable)
            .set({ revokedAt: new Date() })
            .where(eq(refreshTokensTable.jti, jti));
    }

    async revokeFamily(familyId: string): Promise<void> {
        const rows = await this.databaseService.db
            .select({ jti: refreshTokensTable.jti })
            .from(refreshTokensTable)
            .where(eq(refreshTokensTable.familyId, familyId));

        const multi = this.cacheService.client.multi();

        rows.forEach(({ jti }) => multi.del(`refresh:jti:${jti}`));
        multi.del(`refresh:family:${familyId}`);
        await multi.exec();

        await this.databaseService.db
            .update(refreshTokensTable)
            .set({ revokedAt: new Date() })
            .where(and(eq(refreshTokensTable.familyId, familyId), isNull(refreshTokensTable.revokedAt)));
    }

    async isRefreshTokenValid(jti: string): Promise<boolean> {
        return !!(await this.cacheService.client.get(`refresh:jti:${jti}`));
    }

    async addToDenyList(jti: string, ttlSeconds: number): Promise<void> {
        await this.cacheService.client.set(`denylist:jti:${jti}`, "true", { EX: ttlSeconds });
    }

    async isAccessTokenRevoked(jti: string): Promise<boolean> {
        return !!(await this.cacheService.client.get(`denylist:jti:${jti}`));
    }
}
