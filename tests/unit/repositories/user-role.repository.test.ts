import UserRoleRepository, { IUserRoleRepository } from "@/repositories/user-role.repository";
import "reflect-metadata";

describe("UserRoleRepository", () => {
    let mockDb: any;
    let databaseService: { db: any };
    let userRoleRepository: IUserRoleRepository;

    beforeEach(() => {
        mockDb = {
            select: jest.fn(),
            insert: jest.fn(),
            delete: jest.fn(),
        };
        databaseService = { db: mockDb };
        userRoleRepository = new UserRoleRepository(databaseService as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("assignRoles", () => {
        it("should assign new roles to a user", async () => {
            const userId = 1;
            const roleIds = [2, 3];

            // Mock existing roles check - no existing roles
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([]), // No existing roles
                }),
            });

            // Mock insert
            mockDb.insert.mockReturnValue({
                values: jest.fn().mockResolvedValue(undefined),
            });

            await userRoleRepository.assignRoles(userId, roleIds);

            expect(mockDb.insert).toHaveBeenCalledWith(expect.any(Object));
        });

        it("should only assign roles that are not already assigned", async () => {
            const userId = 1;
            const roleIds = [2, 3, 4];

            // Mock existing roles check - role 2 already exists
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([{ role_id: 2 }]), // Role 2 already assigned
                }),
            });

            // Mock insert
            mockDb.insert.mockReturnValue({
                values: jest.fn().mockResolvedValue(undefined),
            });

            await userRoleRepository.assignRoles(userId, roleIds);

            expect(mockDb.insert).toHaveBeenCalledWith(expect.any(Object));
        });

        it("should not do anything when roleIds array is empty", async () => {
            await userRoleRepository.assignRoles(1, []);

            expect(mockDb.select).not.toHaveBeenCalled();
            expect(mockDb.insert).not.toHaveBeenCalled();
        });

        it("should not insert when all roles are already assigned", async () => {
            const userId = 1;
            const roleIds = [2, 3];

            // Mock existing roles check - all roles already exist
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([{ role_id: 2 }, { role_id: 3 }]),
                }),
            });

            await userRoleRepository.assignRoles(userId, roleIds);

            expect(mockDb.insert).not.toHaveBeenCalled();
        });
    });

    describe("removeRoles", () => {
        it("should remove specified roles from a user", async () => {
            const userId = 1;
            const roleIds = [2, 3];

            mockDb.delete.mockReturnValue({
                where: jest.fn().mockResolvedValue(undefined),
            });

            await userRoleRepository.removeRoles(userId, roleIds);

            expect(mockDb.delete).toHaveBeenCalledWith(expect.any(Object));
        });

        it("should not do anything when roleIds array is empty", async () => {
            await userRoleRepository.removeRoles(1, []);

            expect(mockDb.delete).not.toHaveBeenCalled();
        });
    });

    describe("getRoles", () => {
        it("should return roles for a user", async () => {
            const mockRoles = [
                {
                    id: 1,
                    name: "admin",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 2,
                    name: "user",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue(mockRoles),
                    }),
                }),
            });

            const result = await userRoleRepository.getRoles(1);

            expect(result).toEqual(mockRoles);
            expect(mockDb.select).toHaveBeenCalled();
        });

        it("should return empty array when user has no roles", async () => {
            mockDb.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    innerJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const result = await userRoleRepository.getRoles(1);

            expect(result).toEqual([]);
        });
    });
});
