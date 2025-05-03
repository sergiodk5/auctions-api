import { createUserSchema, loginSchema } from "@/db/usersSchema";
import { Router } from "express";
import container from "@/di/container";
import { IAuthController } from "@/controllers/auth.controller";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IValidationMiddleware } from "@/middlewares/ValidationMiddleware";

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

export default authRouter;
