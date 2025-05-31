import { IUsersController } from "@/controllers/users.controller";
import { createUserSchema, updateUserSchema } from "@/db/users.schema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import express from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);
const usersController = container.get<IUsersController>(TYPES.IUsersController);

const userRoute = express.Router();

userRoute.use(authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware));

userRoute.get("/", usersController.getAllUsers.bind(usersController));

userRoute.post("/", validationMiddleware.validate(createUserSchema), usersController.createUser.bind(usersController));

userRoute.get("/:id", usersController.getUserById.bind(usersController));

userRoute.put(
    "/:id",
    validationMiddleware.validate(updateUserSchema),
    usersController.updateUser.bind(usersController),
);

userRoute.delete("/:id", usersController.deleteUser.bind(usersController));

export default userRoute;
