export interface Permission {
    id: number;
    name: string;
    description?: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface Role {
    id: number;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export interface RolePermission {
    id: number;
    role_id: number;
    permission_id: number;
}

export interface UserRole {
    user_id: number;
    role_id: number;
}

export interface CreatePermissionDto {
    name: string;
    description?: string;
}

export interface UpdatePermissionDto {
    name?: string;
    description?: string;
}

export interface CreateRoleDto {
    name: string;
}

export interface UpdateRoleDto {
    name?: string;
}

export interface AssignRolePermissionDto {
    role_id: number;
    permission_id: number;
}

export interface AssignUserRoleDto {
    user_id: number;
    role_id: number;
}

// Extended types with joined data
export interface RoleWithPermissions extends Role {
    permissions: Permission[];
}

export interface UserWithRoles {
    id: number;
    email: string;
    emailVerified: boolean;
    emailVerifiedAt?: Date | null;
    roles: Role[];
}

export interface PermissionWithRoles extends Permission {
    roles: Role[];
}
