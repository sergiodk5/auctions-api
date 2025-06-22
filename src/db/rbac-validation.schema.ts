import { z } from "zod";

// Role schemas
export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Role name is required").max(100, "Role name too long"),
    }),
});

export const updateRoleSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Role name is required").max(100, "Role name too long").optional(),
    }),
});

export const assignRolePermissionSchema = z.object({
    body: z.object({
        permission_id: z.number().int().positive("Permission ID must be a positive integer"),
    }),
});

export const setRolePermissionsSchema = z.object({
    body: z.object({
        permission_ids: z.array(z.number().int().positive()).min(0, "Permission IDs array is required"),
    }),
});

// Permission schemas
export const createPermissionSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Permission name is required").max(100, "Permission name too long"),
        description: z.string().max(255, "Description too long").optional(),
    }),
});

export const updatePermissionSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Permission name is required").max(100, "Permission name too long").optional(),
        description: z.string().max(255, "Description too long").optional(),
    }),
});

// User role assignment schemas
export const assignUserRolesSchema = z.object({
    body: z.object({
        role_ids: z.array(z.number().int().positive()).min(1, "At least one role ID is required"),
    }),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>["body"];
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>["body"];
export type AssignRolePermissionDto = z.infer<typeof assignRolePermissionSchema>["body"];
export type SetRolePermissionsDto = z.infer<typeof setRolePermissionsSchema>["body"];
export type CreatePermissionDto = z.infer<typeof createPermissionSchema>["body"];
export type UpdatePermissionDto = z.infer<typeof updatePermissionSchema>["body"];
export type AssignUserRolesDto = z.infer<typeof assignUserRolesSchema>["body"];
