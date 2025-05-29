import { permissionsTable } from "@/db/roles-permissions.schema";
import PermissionRepository, { IPermissionRepository } from "@/repositories/permission.repository";
import { IDatabaseService } from "@/services/database.service";
import { eq } from "drizzle-orm";
import "reflect-metadata";

describe("PermissionRepository", () => {
    let mockDb: any;
    let databaseService: { db: any };
    let repo: IPermissionRepository;

    beforeEach(() => {
        mockDb = {
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        databaseService = { db: mockDb };
        repo = new PermissionRepository(databaseService as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findAll", () => {
        it("returns all permissions", async () => {
            const permissions = [
                { 
                    id: 1, 
                    name: "user:read", 
                    description: "Read user information",
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ];
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue(Promise.resolve(permissions)),
            });

            const result = await repo.findAll();

            expect(mockDb.select).toHaveBeenCalledWith({
                id: permissionsTable.id,
                name: permissionsTable.name,
                description: permissionsTable.description,
                created_at: permissionsTable.created_at,
                updated_at: permissionsTable.updated_at,
            });
            expect(result).toEqual(permissions);
        });
    });

    describe("findById", () => {
        it("returns permission by ID", async () => {
            const permission = { 
                id: 1, 
                name: "user:read", 
                description: "Read user information",
                created_at: new Date(),
                updated_at: new Date()
            };
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue(Promise.resolve([permission])),
                }),
            });

            const result = await repo.findById(1);

            expect(mockDb.select).toHaveBeenCalled();
            expect(result).toEqual(permission);
        });

        it("returns undefined when permission not found", async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue(Promise.resolve([])),
                }),
            });

            const result = await repo.findById(999);
            expect(result).toBeUndefined();
        });
    });

    describe("findByName", () => {
        it("returns permission by name", async () => {
            const permission = { 
                id: 1, 
                name: "user:read", 
                description: "Read user information",
                created_at: new Date(),
                updated_at: new Date()
            };
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue(Promise.resolve([permission])),
                }),
            });

            const result = await repo.findByName("user:read");

            expect(result).toEqual(permission);
        });
    });

    describe("create", () => {
        it("creates a new permission", async () => {
            const newPermission = {
                id: 1,
                name: "user:create",
                description: "Create new users",
                created_at: new Date(),
                updated_at: new Date()
            };
            mockDb.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue(Promise.resolve([newPermission])),
                }),
            });

            const result = await repo.create({
                name: "user:create",
                description: "Create new users"
            });

            expect(mockDb.insert).toHaveBeenCalledWith(permissionsTable);
            expect(result).toEqual(newPermission);
        });
    });

    describe("update", () => {
        it("updates an existing permission", async () => {
            const updatedPermission = {
                id: 1,
                name: "user:read",
                description: "Updated description",
                created_at: new Date(),
                updated_at: new Date()
            };
            mockDb.update.mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockReturnValue(Promise.resolve([updatedPermission])),
                    }),
                }),
            });

            const result = await repo.update(1, { description: "Updated description" });

            expect(mockDb.update).toHaveBeenCalledWith(permissionsTable);
            expect(result).toEqual(updatedPermission);
        });
    });

    describe("delete", () => {
        it("deletes a permission and returns true", async () => {
            mockDb.delete.mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue(Promise.resolve([{ id: 1 }])),
                }),
            });

            const result = await repo.delete(1);

            expect(mockDb.delete).toHaveBeenCalledWith(permissionsTable);
            expect(result).toBe(true);
        });

        it("returns false when permission not found", async () => {
            mockDb.delete.mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue(Promise.resolve([])),
                }),
            });

            const result = await repo.delete(999);
            expect(result).toBe(false);
        });
    });
});
