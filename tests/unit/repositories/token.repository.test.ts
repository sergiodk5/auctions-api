import "reflect-metadata";
import { REFRESH_ABSOLUTE_TTL, REFRESH_IDLE_TTL } from "@/config/env";
import { refreshFamiliesTable, refreshTokensTable } from "@/db/tokens.schema";
import TokenRepository, { ITokenRepository } from "@/repositories/token.repository";
import { and, eq, isNull } from "drizzle-orm";

describe("TokenRepository", () => {
    let mockDb: any;
    let mockCache: any;
    let databaseService: { db: any };
    let cacheService: { client: any };
    let repo: ITokenRepository;

    beforeEach(() => {
        // Stub Drizzle methods
        mockDb = {
            insert: jest.fn(),
            update: jest.fn(),
            select: jest.fn(),
        };

        // Stub Redis client methods
        const multiBuilder = {
            set: jest.fn().mockReturnThis(),
            sAdd: jest.fn().mockReturnThis(),
            expire: jest.fn().mockReturnThis(),
            del: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(undefined),
        };
        mockCache = {
            multi: jest.fn().mockReturnValue(multiBuilder),
            del: jest.fn().mockResolvedValue(undefined),
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue("OK"),
        };

        databaseService = { db: mockDb };
        cacheService = { client: mockCache };
        repo = new TokenRepository(databaseService as any, cacheService as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("storeRefreshToken", () => {
        it("persists the refresh token in cache and database", async () => {
            // Prepare two insert builders for families and tokens
            const familyInsertBuilder = {
                values: jest.fn().mockReturnThis(),
                onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
            };
            const tokenInsertBuilder = {
                values: jest.fn().mockResolvedValue(undefined),
            };
            // First call to insert for families, second for tokens
            mockDb.insert.mockReturnValueOnce(familyInsertBuilder).mockReturnValueOnce(tokenInsertBuilder);

            const jti = "jti123";
            const familyId = "fam456";

            await repo.storeRefreshToken(jti, familyId);

            // Verify cache interactions first
            expect(mockCache.multi).toHaveBeenCalled();
            const m = mockCache.multi();
            expect(m.set).toHaveBeenCalledWith(`refresh:jti:${jti}`, familyId, { EX: REFRESH_IDLE_TTL });
            expect(m.sAdd).toHaveBeenCalledWith(`refresh:family:${familyId}`, jti);
            expect(m.expire).toHaveBeenCalledWith(`refresh:family:${familyId}`, REFRESH_ABSOLUTE_TTL);
            expect(m.exec).toHaveBeenCalled();

            /// Verify DB insert for families
            expect(mockDb.insert).toHaveBeenCalledWith(refreshFamiliesTable);
            expect(familyInsertBuilder.values).toHaveBeenCalledWith({
                familyId,
                userId: null as any,
                absoluteExpiry: expect.any(Date),
            });
            expect(familyInsertBuilder.onConflictDoNothing).toHaveBeenCalled();

            // Verify DB insert for tokens
            expect(mockDb.insert).toHaveBeenCalledWith(refreshTokensTable);
            expect(tokenInsertBuilder.values).toHaveBeenCalledWith({ jti, familyId });
        });
    });

    describe("revokeRefreshToken", () => {
        it("removes from cache and marks revoked in DB", async () => {
            const updateBuilder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockResolvedValue(undefined),
            };
            mockDb.update.mockReturnValue(updateBuilder);

            const jti = "jtiToRevoke";
            await repo.revokeRefreshToken(jti);

            expect(mockCache.del).toHaveBeenCalledWith(`refresh:jti:${jti}`);
            expect(mockDb.update).toHaveBeenCalledWith(refreshTokensTable);
            expect(updateBuilder.set).toHaveBeenCalledWith({ revokedAt: expect.any(Date) });
            expect(updateBuilder.where).toHaveBeenCalledWith(eq(refreshTokensTable.jti, jti));
        });
    });

    describe("revokeFamily", () => {
        it("revokes all tokens in the family", async () => {
            // Simulate DB select returning two jtis
            const rows = [{ jti: "a" }, { jti: "b" }];
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockResolvedValue(rows),
            });

            const updateBuilder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockResolvedValue(undefined),
            };
            mockDb.update.mockReturnValue(updateBuilder);

            const familyId = "famXYZ";
            await repo.revokeFamily(familyId);

            // Verify select
            expect(mockDb.select).toHaveBeenCalledWith({ jti: refreshTokensTable.jti });
            expect(mockDb.select().from).toHaveBeenCalledWith(refreshTokensTable);
            expect(mockDb.select().where).toHaveBeenCalledWith(eq(refreshTokensTable.familyId, familyId));

            // Verify cache multi.del for each jti and family
            expect(mockCache.multi).toHaveBeenCalled();
            const m = mockCache.multi();
            expect(m.del).toHaveBeenCalledWith(`refresh:jti:a`);
            expect(m.del).toHaveBeenCalledWith(`refresh:jti:b`);
            expect(m.del).toHaveBeenCalledWith(`refresh:family:${familyId}`);
            expect(m.exec).toHaveBeenCalled();

            // Verify DB update to mark revoked
            expect(mockDb.update).toHaveBeenCalledWith(refreshTokensTable);
            expect(updateBuilder.set).toHaveBeenCalledWith({ revokedAt: expect.any(Date) });
            expect(updateBuilder.where).toHaveBeenCalledWith(
                and(eq(refreshTokensTable.familyId, familyId), isNull(refreshTokensTable.revokedAt)),
            );
        });
    });

    describe("isRefreshTokenValid", () => {
        it("returns true when cache has the key", async () => {
            mockCache.get.mockResolvedValue("famID");
            expect(await repo.isRefreshTokenValid("jti1")).toBe(true);
            expect(mockCache.get).toHaveBeenCalledWith("refresh:jti:jti1");
        });

        it("returns false when cache misses", async () => {
            mockCache.get.mockResolvedValue(null);
            expect(await repo.isRefreshTokenValid("jti2")).toBe(false);
        });
    });

    describe("addToDenyList", () => {
        it("writes jti to denylist with TTL", async () => {
            await repo.addToDenyList("tokenJti", 123);
            expect(mockCache.set).toHaveBeenCalledWith("denylist:jti:tokenJti", "true", { EX: 123 });
        });
    });

    describe("isAccessTokenRevoked", () => {
        it("returns true when cache has the key", async () => {
            mockCache.get.mockResolvedValue("true");
            expect(await repo.isAccessTokenRevoked("tj")).toBe(true);
            expect(mockCache.get).toHaveBeenCalledWith("denylist:jti:tj");
        });

        it("returns false when cache misses", async () => {
            mockCache.get.mockResolvedValue(null);
            expect(await repo.isAccessTokenRevoked("tj2")).toBe(false);
        });
    });
});
