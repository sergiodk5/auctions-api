import { validateData } from "@/middlewares/validationMiddleware";
import express from "express";
import usersController from "@/controllers/users.controller";
import { createUserSchema, updateUserSchema } from "@/db/usersSchema";



const userRoutes = express.Router();

userRoutes.get("/", usersController.getAllUsers);
userRoutes.post("/", validateData(createUserSchema), usersController.createUser);
userRoutes.get("/:id", usersController.getUserById);
userRoutes.get("/:email", usersController.getUserById);
userRoutes.put("/:id", validateData(updateUserSchema), usersController.updateUser);

export default userRoutes;
