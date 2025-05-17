import { usersTable } from "@/db/users.schema";
import UserRepository, { IUserRepository } from "@/repositories/user.repository";
import * as passwordUtils from "@/utils/password.util";
import { eq } from "drizzle-orm";
import "reflect-metadata";

describe("UserRepository", () => {
    let mockDb: any;
    let databaseService: { db: any };
    let repo: IUserRepository;

    beforeEach(() => {
        mockDb = {
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        databaseService = { db: mockDb };
        repo = new UserRepository(databaseService as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findAll", () => {
        it("returns all users", async () => {
            const users = [{ id: 1, email: "a@x.com" }];
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue(Promise.resolve(users)),
            });

            const result = await repo.findAll();

            expect(mockDb.select).toHaveBeenCalledWith();
            expect(mockDb.select().from).toHaveBeenCalledWith(usersTable);
            expect(result).toEqual(users);
        });
    });

    describe("findById", () => {
        it("returns the user when found", async () => {
            const user = { id: 2, email: "b@x.com" };
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockResolvedValue([user]),
            };
            mockDb.select.mockReturnValue(builder);

            const result = await repo.findById(2);

            expect(mockDb.select).toHaveBeenCalledWith({
                id: usersTable.id,
                email: usersTable.email,
            });
            expect(builder.from).toHaveBeenCalledWith(usersTable);
            expect(builder.where).toHaveBeenCalledWith(eq(usersTable.id, 2));
            expect(result).toEqual(user);
        });

        it("returns undefined when not found", async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockResolvedValue([]),
            };
            mockDb.select.mockReturnValue(builder);

            const result = await repo.findById(999);

            expect(result).toBeUndefined();
        });
    });

    describe("findByEmail", () => {
        it("returns the user when found", async () => {
            const user = { id: 3, email: "c@x.com" };
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockResolvedValue([user]),
            };
            mockDb.select.mockReturnValue(builder);

            const result = await repo.findByEmail("c@x.com");

            expect(mockDb.select).toHaveBeenCalledWith({
                id: usersTable.id,
                email: usersTable.email,
            });
            expect(builder.from).toHaveBeenCalledWith(usersTable);
            expect(builder.where).toHaveBeenCalledWith(eq(usersTable.email, "c@x.com"));
            expect(result).toEqual(user);
        });

        it("returns undefined when not found", async () => {
            const builder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockResolvedValue([]),
            };
            mockDb.select.mockReturnValue(builder);

            const result = await repo.findByEmail("unknown@x.com");

            expect(result).toBeUndefined();
        });
    });

    describe("create", () => {
        it("hashes the password, inserts a new user, and returns it", async () => {
            const dto = { email: "d@x.com", password: "plain" };
            const hashed = "hashedPwd";
            jest.spyOn(passwordUtils, "hashPassword").mockResolvedValue(hashed);

            const created = { id: 4, email: "d@x.com" };
            const builder = {
                values: jest.fn().mockReturnThis(),
                returning: jest.fn().mockResolvedValue([created]),
            };
            mockDb.insert.mockReturnValue(builder);

            const result = await repo.create(dto);

            expect(passwordUtils.hashPassword).toHaveBeenCalledWith("plain");
            expect(mockDb.insert).toHaveBeenCalledWith(usersTable);
            expect(builder.values).toHaveBeenCalledWith({ email: "d@x.com", password: hashed });
            expect(builder.returning).toHaveBeenCalledWith({
                id: usersTable.id,
                email: usersTable.email,
            });
            expect(result).toEqual(created);
        });
    });

    describe("update", () => {
        it("updates an existing user and returns it", async () => {
            const dto = { email: "e@x.com" };
            const updated = { id: 5, email: "e@x.com" };
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockResolvedValue([updated]),
            };
            mockDb.update.mockReturnValue(builder);

            const result = await repo.update(5, dto);

            expect(mockDb.update).toHaveBeenCalledWith(usersTable);
            expect(builder.set).toHaveBeenCalledWith(dto);
            expect(builder.where).toHaveBeenCalledWith(eq(usersTable.id, 5));
            expect(builder.returning).toHaveBeenCalledWith({
                id: usersTable.id,
                email: usersTable.email,
            });
            expect(result).toEqual(updated);
        });

        it("returns undefined if user does not exist", async () => {
            const builder = {
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockResolvedValue([]),
            };
            mockDb.update.mockReturnValue(builder);

            const result = await repo.update(999, { email: "x@x.com" });

            expect(result).toBeUndefined();
        });
    });

    describe("delete", () => {
        it("deletes an existing user and returns true", async () => {
            const builder = {
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockResolvedValue([{ id: 6 }]),
            };
            mockDb.delete.mockReturnValue(builder);

            const result = await repo.delete(6);

            expect(mockDb.delete).toHaveBeenCalledWith(usersTable);
            expect(builder.where).toHaveBeenCalledWith(eq(usersTable.id, 6));
            expect(builder.returning).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it("returns false when result is null", async () => {
            // simulate failure by returning null
            const builder = {
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockResolvedValue(null),
            };
            mockDb.delete.mockReturnValue(builder);

            const result = await repo.delete(7);

            expect(result).toBe(false);
        });
    });
});
