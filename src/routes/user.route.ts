import { IUsersController } from "@/controllers/users.controller";
import { createUserSchema, updateUserSchema } from "@/db/users.schema";
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
    validationMiddleware.validate(createUserSchema),
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
    validationMiddleware.validate(updateUserSchema),
    usersController.updateUser.bind(usersController),
);

// DELETE /:id - Delete user (requires user:delete permission)
userRoute.delete(
    "/:id",
    authorizationMiddleware.requirePermissions(["user:delete"]),
    usersController.deleteUser.bind(usersController),
);

export default userRoute;
