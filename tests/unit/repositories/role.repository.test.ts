import { permissionsTable, rolePermissionsTable, rolesTable } from "@/db/roles-permissions.schema";
import RoleRepository, { IRoleRepository } from "@/repositories/role.repository";
import { IDatabaseService } from "@/services/database.service";
import { and, eq } from "drizzle-orm";
import "reflect-metadata";

describe("RoleRepository", () => {
    let mockDb: any;
    let databaseService: { db: any };
    let repo: IRoleRepository;

    beforeEach(() => {
        mockDb = {
            select: jest.fn(),
            insert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        databaseService = { db: mockDb };
        repo = new RoleRepository(databaseService as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findAll", () => {
        it("returns all roles", async () => {
            const roles = [
                { 
                    id: 1, 
                    name: "admin",
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ];
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue(Promise.resolve(roles)),
            });

            const result = await repo.findAll();

            expect(mockDb.select).toHaveBeenCalledWith({
                id: rolesTable.id,
                name: rolesTable.name,
                created_at: rolesTable.created_at,
                updated_at: rolesTable.updated_at,
            });
            expect(result).toEqual(roles);
        });
    });

    describe("findById", () => {
        it("returns role by ID", async () => {
            const role = { 
                id: 1, 
                name: "admin",
                created_at: new Date(),
                updated_at: new Date()
            };
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue(Promise.resolve([role])),
                }),
            });

            const result = await repo.findById(1);

            expect(result).toEqual(role);
        });

        it("returns undefined when role not found", async () => {
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
        it("returns role by name", async () => {
            const role = { 
                id: 1, 
                name: "admin",
                created_at: new Date(),
                updated_at: new Date()
            };
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue(Promise.resolve([role])),
                }),
            });

            const result = await repo.findByName("admin");

            expect(result).toEqual(role);
        });
    });

    describe("create", () => {
        it("creates a new role", async () => {
            const newRole = {
                id: 1,
                name: "editor",
                created_at: new Date(),
                updated_at: new Date()
            };
            mockDb.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue(Promise.resolve([newRole])),
                }),
            });

            const result = await repo.create({ name: "editor" });

            expect(mockDb.insert).toHaveBeenCalledWith(rolesTable);
            expect(result).toEqual(newRole);
        });
    });

    describe("update", () => {
        it("updates an existing role", async () => {
            const updatedRole = {
                id: 1,
                name: "super-admin",
                created_at: new Date(),
                updated_at: new Date()
            };
            mockDb.update.mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockReturnValue(Promise.resolve([updatedRole])),
                    }),
                }),
            });

            const result = await repo.update(1, { name: "super-admin" });

            expect(mockDb.update).toHaveBeenCalledWith(rolesTable);
            expect(result).toEqual(updatedRole);
        });
    });

    describe("delete", () => {
        it("deletes a role and returns true", async () => {
            mockDb.delete.mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue(Promise.resolve([{ id: 1 }])),
                }),
            });

            const result = await repo.delete(1);

            expect(mockDb.delete).toHaveBeenCalledWith(rolesTable);
            expect(result).toBe(true);
        });

        it("returns false when role not found", async () => {
            mockDb.delete.mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue(Promise.resolve([])),
                }),
            });

            const result = await repo.delete(999);
            expect(result).toBe(false);
        });
    });

    describe("assignPermission", () => {
        it("assigns a permission to a role", async () => {
            mockDb.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    onConflictDoNothing: jest.fn().mockReturnValue(Promise.resolve()),
                }),
            });

            await repo.assignPermission({ role_id: 1, permission_id: 2 });

            expect(mockDb.insert).toHaveBeenCalledWith(rolePermissionsTable);
        });
    });

    describe("removePermission", () => {
        it("removes a permission from a role and returns true", async () => {
            mockDb.delete.mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue(Promise.resolve([{ id: 1 }])),
                }),
            });

            const result = await repo.removePermission(1, 2);

            expect(mockDb.delete).toHaveBeenCalledWith(rolePermissionsTable);
            expect(result).toBe(true);
        });

        it("returns false when permission assignment not found", async () => {
            mockDb.delete.mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn().mockReturnValue(Promise.resolve([])),
                }),
            });

            const result = await repo.removePermission(1, 999);
            expect(result).toBe(false);
        });
    });

    describe("hasPermission", () => {
        it("returns true when role has permission", async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue(Promise.resolve([{ count: 1 }])),
                        }),
                    }),
                }),
            });

            const result = await repo.hasPermission(1, "user:read");

            expect(result).toBe(true);
        });

        it("returns false when role does not have permission", async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue(Promise.resolve([])),
                        }),
                    }),
                }),
            });

            const result = await repo.hasPermission(1, "nonexistent:permission");

            expect(result).toBe(false);
        });
    });

    describe("setPermissions", () => {
        it("sets permissions for a role", async () => {
            const mockTransaction = jest.fn();
            mockDb.transaction = mockTransaction;
            
            const mockTx = {
                delete: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue(Promise.resolve()),
                }),
                insert: jest.fn().mockReturnValue({
                    values: jest.fn().mockReturnValue(Promise.resolve()),
                }),
            };

            mockTransaction.mockImplementation(async (callback: any) => {
                await callback(mockTx);
                return Promise.resolve();
            });

            await repo.setPermissions(1, [1, 2, 3]);

            expect(mockTransaction).toHaveBeenCalled();
            expect(mockTx.delete).toHaveBeenCalledWith(rolePermissionsTable);
            expect(mockTx.insert).toHaveBeenCalledWith(rolePermissionsTable);
        });

        it("handles empty permission array", async () => {
            const mockTransaction = jest.fn();
            mockDb.transaction = mockTransaction;
            
            const mockTx = {
                delete: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue(Promise.resolve()),
                }),
                insert: jest.fn(),
            };

            mockTransaction.mockImplementation(async (callback: any) => {
                await callback(mockTx);
                return Promise.resolve();
            });

            await repo.setPermissions(1, []);

            expect(mockTransaction).toHaveBeenCalled();
            expect(mockTx.delete).toHaveBeenCalledWith(rolePermissionsTable);
            expect(mockTx.insert).not.toHaveBeenCalled();
        });
    });

    describe("getPermissions", () => {
        it("returns permissions for a role", async () => {
            const permissions = [
                { 
                    id: 1, 
                    name: "user:read", 
                    description: "Read user information",
                    created_at: new Date(),
                    updated_at: new Date()
                },
                { 
                    id: 2, 
                    name: "user:write", 
                    description: "Write user information",
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ];
            
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue(Promise.resolve(permissions)),
                    }),
                }),
            });

            const result = await repo.getPermissions(1);

            expect(mockDb.select).toHaveBeenCalledWith({
                id: permissionsTable.id,
                name: permissionsTable.name,
                description: permissionsTable.description,
                created_at: permissionsTable.created_at,
                updated_at: permissionsTable.updated_at,
            });
            expect(result).toEqual(permissions);
        });

        it("returns empty array when role has no permissions", async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue(Promise.resolve([])),
                    }),
                }),
            });

            const result = await repo.getPermissions(999);

            expect(result).toEqual([]);
        });
    });
});
