import { Container } from "inversify";
import { IPermissionService } from "../../../src/services/permission.service";
import { CreatePermissionDto, Permission, UpdatePermissionDto } from "../../../src/types/permissions";

export interface MockPermissionConfig {
    shouldSimulateError: boolean;
    errorType: "PermissionNotFound" | "PermissionExists" | "DatabaseError";
    errorMessage: string;
    delay: number;
}

export class MockPermissionService implements IPermissionService {
    private static instance: MockPermissionService;
    private config: MockPermissionConfig = {
        shouldSimulateError: false,
        errorType: "PermissionNotFound",
        errorMessage: "Mock permission error",
        delay: 0,
    };
    private permissions: Permission[] = [];
    private nextId = 1;

    static getInstance(): MockPermissionService {
        if (!MockPermissionService.instance) {
            MockPermissionService.instance = new MockPermissionService();
        }
        return MockPermissionService.instance;
    }

    static bindToContainer(container: Container): void {
        const mockPermission = MockPermissionService.getInstance();
        container.bind<IPermissionService>("PermissionService").toConstantValue(mockPermission);
    }

    static configureInstance(config: Partial<MockPermissionConfig>): void {
        const instance = MockPermissionService.getInstance();
        instance.config = { ...instance.config, ...config };
    }

    static resetInstance(): void {
        const instance = MockPermissionService.getInstance();
        instance.config = {
            shouldSimulateError: false,
            errorType: "PermissionNotFound",
            errorMessage: "Mock permission error",
            delay: 0,
        };
        instance.permissions = [];
        instance.nextId = 1;
    }

    private async simulateDelay(): Promise<void> {
        if (this.config.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.config.delay));
        }
    }

    private checkForError(): void {
        if (this.config.shouldSimulateError) {
            throw new Error(this.config.errorType);
        }
    }

    async getAllPermissions(): Promise<Permission[]> {
        await this.simulateDelay();
        this.checkForError();
        return [...this.permissions];
    }

    async getPermissionById(id: number): Promise<Permission> {
        await this.simulateDelay();
        this.checkForError();
        const permission = this.permissions.find((p) => p.id === id);
        if (!permission) {
            throw new Error("PermissionNotFound");
        }
        return permission;
    }

    async getPermissionByName(name: string): Promise<Permission> {
        await this.simulateDelay();
        this.checkForError();
        const permission = this.permissions.find((p) => p.name === name);
        if (!permission) {
            throw new Error("PermissionNotFound");
        }
        return permission;
    }

    async createPermission(data: CreatePermissionDto): Promise<Permission> {
        await this.simulateDelay();
        this.checkForError();

        const existing = this.permissions.find((p) => p.name === data.name);
        if (existing) {
            throw new Error("PermissionExists");
        }

        const newPermission: Permission = {
            id: this.nextId++,
            name: data.name,
            description: data.description ?? null,
            created_at: new Date(),
            updated_at: new Date(),
        };

        this.permissions.push(newPermission);
        return newPermission;
    }

    async updatePermission(id: number, data: UpdatePermissionDto): Promise<Permission> {
        await this.simulateDelay();
        this.checkForError();

        const permissionIndex = this.permissions.findIndex((p) => p.id === id);
        if (permissionIndex === -1) {
            throw new Error("PermissionNotFound");
        }

        const updatedPermission: Permission = {
            ...this.permissions[permissionIndex],
            ...data,
            updated_at: new Date(),
        };

        this.permissions[permissionIndex] = updatedPermission;
        return updatedPermission;
    }

    async deletePermission(id: number): Promise<void> {
        await this.simulateDelay();
        this.checkForError();

        const permissionIndex = this.permissions.findIndex((p) => p.id === id);
        if (permissionIndex === -1) {
            throw new Error("PermissionNotFound");
        }

        this.permissions.splice(permissionIndex, 1);
    }

    // Test helper methods
    seedPermissions(permissions: Permission[]): void {
        this.permissions = [...permissions];
        this.nextId = Math.max(...permissions.map((p) => p.id)) + 1;
    }

    getStoredPermissions(): Permission[] {
        return [...this.permissions];
    }

    clearPermissions(): void {
        this.permissions = [];
        this.nextId = 1;
    }

    getConfig(): MockPermissionConfig {
        return { ...this.config };
    }
}
