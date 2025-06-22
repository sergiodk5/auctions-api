import { IPermissionController } from "@/controllers/permission.controller";
import { createPermissionSchema, updatePermissionSchema } from "@/db/rbac-validation.schema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import express from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const permissionController = container.get<IPermissionController>(TYPES.IPermissionController);

const permissionRoute = express.Router();

// Apply authentication to all permission routes
permissionRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// Apply admin role requirement to all permission routes
permissionRoute.use(authorizationMiddleware.requireRoles(["admin"]));

// GET / - List all permissions (admin only)
permissionRoute.get("/", permissionController.getAllPermissions.bind(permissionController));

// POST / - Create new permission (admin only)
permissionRoute.post(
    "/",
    validationMiddleware.validate(createPermissionSchema),
    permissionController.createPermission.bind(permissionController),
);

// GET /:id - Get permission by ID (admin only)
permissionRoute.get("/:id", permissionController.getPermissionById.bind(permissionController));

// PUT /:id - Update permission (admin only)
permissionRoute.put(
    "/:id",
    validationMiddleware.validate(updatePermissionSchema),
    permissionController.updatePermission.bind(permissionController),
);

// DELETE /:id - Delete permission (admin only)
permissionRoute.delete("/:id", permissionController.deletePermission.bind(permissionController));

export default permissionRoute;
