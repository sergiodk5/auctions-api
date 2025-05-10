import { IAuthController } from "@/controllers/auth.controller";
import { createUserSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema } from "@/db/usersSchema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IValidationMiddleware } from "@/middlewares/ValidationMiddleware";
import { Router } from "express";

const authGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthGuardMiddleware);
const refreshRateLimiter = container.get<IMiddleware>(TYPES.IRefreshRateLimiter);
const loginRateLimiter = container.get<IMiddleware>(TYPES.ILoginRateLimiter);
const authController = container.get<IAuthController>(TYPES.IAuthController);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);

const authRouter = Router();

authRouter.post(
    "/register",
    validationMiddleware.validate(createUserSchema),
    authController.register.bind(authController),
);
authRouter.post(
    "/login",
    loginRateLimiter.handle.bind(loginRateLimiter),
    validationMiddleware.validate(loginSchema),
    authController.login.bind(authController),
);
authRouter.post(
    "/refresh",
    refreshRateLimiter.handle.bind(refreshRateLimiter),
    authController.refresh.bind(authController),
);
authRouter.post(
    "/revoke",
    authGuardMiddleware.handle.bind(authGuardMiddleware),
    authController.revoke.bind(authController),
);
authRouter.post(
    "/logout",
    authGuardMiddleware.handle.bind(authGuardMiddleware),
    authController.logout.bind(authController),
);

authRouter.post(
    "/forgot-password",
    validationMiddleware.validate(forgotPasswordSchema),
    authController.forgotPassword.bind(authController),
);
authRouter.post(
    "/reset-password",
    validationMiddleware.validate(resetPasswordSchema),
    authController.resetPassword.bind(authController),
);

export default authRouter;
