import { IValidationMiddleware } from "@/middlewares/ValidationMiddleware";
import express from "express";
import { IUsersController } from "@/controllers/users.controller";
import { createUserSchema, updateUserSchema } from "@/db/usersSchema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";

const authGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthGuardMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const usersController = container.get<IUsersController>(TYPES.IUsersController);

const userRoutes = express.Router();

userRoutes.use(authGuardMiddleware.handle.bind(authGuardMiddleware));
userRoutes.get("/", usersController.getAllUsers.bind(usersController));
userRoutes.post("/", validationMiddleware.validate(createUserSchema), usersController.createUser.bind(usersController));
userRoutes.get("/:id", usersController.getUserById.bind(usersController));
userRoutes.put(
    "/:id",
    validationMiddleware.validate(updateUserSchema),
    usersController.updateUser.bind(usersController),
);
userRoutes.delete("/:id", usersController.deleteUser.bind(usersController));

export default userRoutes;
