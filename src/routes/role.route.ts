import { IRoleController } from "@/controllers/role.controller";
import {
    assignRolePermissionSchema,
    createRoleSchema,
    setRolePermissionsSchema,
    updateRoleSchema,
} from "@/db/rbac-validation.schema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import express from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const roleController = container.get<IRoleController>(TYPES.IRoleController);

const roleRoute = express.Router();

// Apply authentication to all role routes
roleRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// Apply admin role requirement to all role routes
roleRoute.use(authorizationMiddleware.requireRoles(["admin"]));

// GET / - List all roles (admin only)
// Query parameter: ?include_permissions=true to include permissions
roleRoute.get("/", roleController.getAllRoles.bind(roleController));

// POST / - Create new role (admin only)
roleRoute.post("/", validationMiddleware.validate(createRoleSchema), roleController.createRole.bind(roleController));

// GET /:id - Get role by ID (admin only)
// Query parameter: ?include_permissions=true to include permissions
roleRoute.get("/:id", roleController.getRoleById.bind(roleController));

// PUT /:id - Update role (admin only)
roleRoute.put("/:id", validationMiddleware.validate(updateRoleSchema), roleController.updateRole.bind(roleController));

// DELETE /:id - Delete role (admin only)
roleRoute.delete("/:id", roleController.deleteRole.bind(roleController));

// POST /:id/permissions - Assign permission to role (admin only)
roleRoute.post(
    "/:id/permissions",
    validationMiddleware.validate(assignRolePermissionSchema),
    roleController.assignPermissionToRole.bind(roleController),
);

// DELETE /:id/permissions/:permissionId - Remove permission from role (admin only)
roleRoute.delete("/:id/permissions/:permissionId", roleController.removePermissionFromRole.bind(roleController));

// PUT /:id/permissions - Set all permissions for role (admin only)
roleRoute.put(
    "/:id/permissions",
    validationMiddleware.validate(setRolePermissionsSchema),
    roleController.setRolePermissions.bind(roleController),
);

export default roleRoute;
