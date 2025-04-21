import { validateData } from "@/middlewares/validationMiddleware";
import express from "express";
import usersController from "@/controllers/users.controller";
import { createUserSchema, updateUserSchema } from "@/db/usersSchema";
import { verifyToken } from "@/middlewares/authMiddleware";



const userRoutes = express.Router();

userRoutes.get("/", verifyToken, usersController.getAllUsers);
userRoutes.post("/", validateData(createUserSchema), usersController.createUser);
userRoutes.get("/:id", usersController.getUserById);
userRoutes.put("/:id", validateData(updateUserSchema), usersController.updateUser);
userRoutes.delete("/:id", usersController.deleteUser);

export default userRoutes;
