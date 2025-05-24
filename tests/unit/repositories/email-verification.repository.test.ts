import { emailVerificationTable } from "@/db/email-verification.schema";
import {
    EmailVerificationRepository,
    IEmailVerificationRepository,
} from "@/repositories/email-verification.repository";
import { IDatabaseService } from "@/services/database.service";
import { and, eq, isNull } from "drizzle-orm";

describe("EmailVerificationRepository", () => {
    let repository: IEmailVerificationRepository;
    let mockDb: jest.Mocked<IDatabaseService>;
    let mockDrizzle: any;

    beforeEach(() => {
        mockDrizzle = {
            insert: jest.fn().mockReturnThis(),
            values: jest.fn().mockResolvedValue(undefined),
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
        };

        mockDb = {
            db: mockDrizzle,
        } as any;

        repository = new EmailVerificationRepository(mockDb);
    });

    describe("create", () => {
        it("should create a new email verification record", async () => {
            const userId = 1;
            const token = "test-token-123";

            await repository.create(userId, token);

            expect(mockDrizzle.insert).toHaveBeenCalledWith(emailVerificationTable);
            expect(mockDrizzle.values).toHaveBeenCalledWith({
                userId,
                token,
            });
        });
    });

    describe("findByToken", () => {
        it("should find verification record by token when not verified", async () => {
            const token = "test-token-123";
            const mockResult = [{ id: 1, userId: 1 }];

            mockDrizzle.limit.mockResolvedValue(mockResult);

            const result = await repository.findByToken(token);

            expect(mockDrizzle.select).toHaveBeenCalledWith({
                id: emailVerificationTable.id,
                userId: emailVerificationTable.userId,
            });
            expect(mockDrizzle.from).toHaveBeenCalledWith(emailVerificationTable);
            expect(mockDrizzle.where).toHaveBeenCalledWith(
                and(eq(emailVerificationTable.token, token), isNull(emailVerificationTable.verifiedAt)),
            );
            expect(mockDrizzle.limit).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockResult[0]);
        });

        it("should return null when no verification record found", async () => {
            const token = "non-existent-token";

            mockDrizzle.limit.mockResolvedValue([]);

            const result = await repository.findByToken(token);

            expect(result).toBeNull();
        });
    });

    describe("markAsVerified", () => {
        it("should mark verification record as verified", async () => {
            const id = 1;
            const mockDate = new Date();
            const originalDate = global.Date;
            global.Date = jest.fn(() => mockDate) as any;

            await repository.markAsVerified(id);

            expect(mockDrizzle.update).toHaveBeenCalledWith(emailVerificationTable);
            expect(mockDrizzle.set).toHaveBeenCalledWith({ verifiedAt: mockDate });
            expect(mockDrizzle.where).toHaveBeenCalledWith(eq(emailVerificationTable.id, id));

            global.Date = originalDate;
        });
    });

    describe("deleteByUserId", () => {
        it("should delete verification records for a user", async () => {
            const userId = 1;

            await repository.deleteByUserId(userId);

            expect(mockDrizzle.delete).toHaveBeenCalledWith(emailVerificationTable);
            expect(mockDrizzle.where).toHaveBeenCalledWith(eq(emailVerificationTable.userId, userId));
        });
    });
});
