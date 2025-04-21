import { createUserSchema, loginSchema } from '@/db/usersSchema';
import { validateData } from '@/middlewares/validationMiddleware';
import { Router } from 'express';
import authController from '@/controllers/auth.controller';

const authRouter = Router();

authRouter.post("/register", validateData(createUserSchema), authController.registerUser);
authRouter.post("/login", validateData(loginSchema), authController.loginUser);
authRouter.post("/logout", (req, res) => { });

export default authRouter;