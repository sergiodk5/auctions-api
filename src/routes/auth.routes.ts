import { createUserSchema, loginSchema } from "@/db/usersSchema";
import { validateData } from "@/middlewares/validationMiddleware";
import { Router } from "express";
import authController from "@/controllers/auth.controller";
import { authGuard } from "@/middlewares/auth.guard";
import { loginRateLimit, refreshRateLimit } from "@/middlewares/rateLimiter";

const authRouter = Router();

authRouter.post("/register", validateData(createUserSchema), authController.register.bind(authController));
authRouter.post("/login", loginRateLimit, validateData(loginSchema), authController.login.bind(authController));
authRouter.post("/refresh", refreshRateLimit, authController.refresh.bind(authController));
authRouter.post("/revoke", authGuard, authController.revoke.bind(authController));
authRouter.post("/logout", authGuard, authController.logout.bind(authController));

export default authRouter;
