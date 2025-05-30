import { permissionsTable } from "@/db/rbac.schema";
import { TYPES } from "@/di/types";
import { type IDatabaseService } from "@/services/database.service";
import { CreatePermissionDto, Permission, UpdatePermissionDto } from "@/types/permissions";
import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

export interface IPermissionRepository {
    findAll(): Promise<Permission[]>;
    findById(id: number): Promise<Permission | undefined>;
    findByName(name: string): Promise<Permission | undefined>;
    create(data: CreatePermissionDto): Promise<Permission>;
    update(id: number, data: UpdatePermissionDto): Promise<Permission | undefined>;
    delete(id: number): Promise<boolean>;
}

@injectable()
export default class PermissionRepository implements IPermissionRepository {
    constructor(@inject(TYPES.IDatabaseService) private readonly databaseService: IDatabaseService) {}

    async findAll(): Promise<Permission[]> {
        const permissions = await this.databaseService.db
            .select({
                id: permissionsTable.id,
                name: permissionsTable.name,
                description: permissionsTable.description,
                created_at: permissionsTable.created_at,
                updated_at: permissionsTable.updated_at,
            })
            .from(permissionsTable);
        return permissions;
    }

    async findById(id: number): Promise<Permission | undefined> {
        const [permission] = await this.databaseService.db
            .select({
                id: permissionsTable.id,
                name: permissionsTable.name,
                description: permissionsTable.description,
                created_at: permissionsTable.created_at,
                updated_at: permissionsTable.updated_at,
            })
            .from(permissionsTable)
            .where(eq(permissionsTable.id, id));
        return permission;
    }

    async findByName(name: string): Promise<Permission | undefined> {
        const [permission] = await this.databaseService.db
            .select({
                id: permissionsTable.id,
                name: permissionsTable.name,
                description: permissionsTable.description,
                created_at: permissionsTable.created_at,
                updated_at: permissionsTable.updated_at,
            })
            .from(permissionsTable)
            .where(eq(permissionsTable.name, name));
        return permission;
    }

    async create(data: CreatePermissionDto): Promise<Permission> {
        const [permission] = await this.databaseService.db
            .insert(permissionsTable)
            .values({
                name: data.name,
                description: data.description,
            })
            .returning({
                id: permissionsTable.id,
                name: permissionsTable.name,
                description: permissionsTable.description,
                created_at: permissionsTable.created_at,
                updated_at: permissionsTable.updated_at,
            });
        return permission;
    }

    async update(id: number, data: UpdatePermissionDto): Promise<Permission | undefined> {
        const [permission] = await this.databaseService.db
            .update(permissionsTable)
            .set({
                ...data,
                updated_at: new Date(),
            })
            .where(eq(permissionsTable.id, id))
            .returning({
                id: permissionsTable.id,
                name: permissionsTable.name,
                description: permissionsTable.description,
                created_at: permissionsTable.created_at,
                updated_at: permissionsTable.updated_at,
            });
        return permission;
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.databaseService.db
            .delete(permissionsTable)
            .where(eq(permissionsTable.id, id))
            .returning({ id: permissionsTable.id });

        return result.length > 0;
    }
}
