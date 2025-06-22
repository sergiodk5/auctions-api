import { IUsersController } from "@/controllers/users.controller";
import { assignUserRolesSchema } from "@/db/rbac-validation.schema";
import { createUserRouteSchema, updateUserRouteSchema } from "@/db/user-validation.schema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import express from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const authorizationMiddleware = container.get<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const usersController = container.get<IUsersController>(TYPES.IUsersController);

const userRoute = express.Router();

userRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

// GET / - List all users (requires user:read permission)
userRoute.get(
    "/",
    authorizationMiddleware.requirePermissions(["user:read"]),
    usersController.getAllUsers.bind(usersController),
);

// POST / - Create new user (requires user:create permission)
userRoute.post(
    "/",
    authorizationMiddleware.requirePermissions(["user:create"]),
    validationMiddleware.validate(createUserRouteSchema),
    usersController.createUser.bind(usersController),
);

// GET /:id - Get user by ID (requires user:read permission)
userRoute.get(
    "/:id",
    authorizationMiddleware.requirePermissions(["user:read"]),
    usersController.getUserById.bind(usersController),
);

// PUT /:id - Update user (requires user:update permission)
userRoute.put(
    "/:id",
    authorizationMiddleware.requirePermissions(["user:update"]),
    validationMiddleware.validate(updateUserRouteSchema),
    usersController.updateUser.bind(usersController),
);

// DELETE /:id - Delete user (requires user:delete permission)
userRoute.delete(
    "/:id",
    authorizationMiddleware.requirePermissions(["user:delete"]),
    usersController.deleteUser.bind(usersController),
);

// User-Role Management Routes (Admin only)

// GET /:id/roles - Get user's roles (admin only)
userRoute.get(
    "/:id/roles",
    authorizationMiddleware.requireRoles(["admin"]),
    usersController.getUserRoles.bind(usersController),
);

// POST /:id/roles - Assign roles to user (admin only)
userRoute.post(
    "/:id/roles",
    authorizationMiddleware.requireRoles(["admin"]),
    validationMiddleware.validate(assignUserRolesSchema),
    usersController.assignUserRoles.bind(usersController),
);

// DELETE /:id/roles/:roleId - Remove role from user (admin only)
userRoute.delete(
    "/:id/roles/:roleId",
    authorizationMiddleware.requireRoles(["admin"]),
    usersController.removeUserRole.bind(usersController),
);

export default userRoute;
