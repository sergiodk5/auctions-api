import { validateData } from "@/middlewares/validationMiddleware";
import express from "express";
import usersController from "@/controllers/users.controller";
import { createUserSchema, updateUserSchema } from "@/db/usersSchema";
import { authGuard } from "@/middlewares/auth.guard";

const userRoutes = express.Router();

userRoutes.use(authGuard);
userRoutes.get("/", usersController.getAllUsers.bind(usersController));
userRoutes.post("/", validateData(createUserSchema), usersController.createUser.bind(usersController));
userRoutes.get("/:id", usersController.getUserById.bind(usersController));
userRoutes.put("/:id", validateData(updateUserSchema), usersController.updateUser.bind(usersController));
userRoutes.delete("/:id", usersController.deleteUser.bind(usersController));

export default userRoutes;
