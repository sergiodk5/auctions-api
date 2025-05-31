import { IAuthController } from "@/controllers/auth.controller";
import {
    createUserSchema,
    emailVerificationSchema,
    forgotPasswordSchema,
    loginSchema,
    resetPasswordSchema,
} from "@/db/users.schema";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";

const authenticationGuardMiddleware = container.get<IMiddleware>(TYPES.IAuthenticationGuardMiddleware);
const refreshRateLimiter = container.get<IMiddleware>(TYPES.IRefreshRateLimiter);
const loginRateLimiter = container.get<IMiddleware>(TYPES.ILoginRateLimiter);
const authController = container.get<IAuthController>(TYPES.IAuthController);
const validationMiddleware = container.get<IValidationMiddleware>(TYPES.IValidationMiddleware);

const authRoute = Router();

authRoute.post(
    "/register",
    validationMiddleware.validate(createUserSchema),
    authController.register.bind(authController),
);

authRoute.post(
    "/login",
    loginRateLimiter.handle.bind(loginRateLimiter),
    validationMiddleware.validate(loginSchema),
    authController.login.bind(authController),
);

authRoute.post(
    "/refresh",
    refreshRateLimiter.handle.bind(refreshRateLimiter),
    authController.refresh.bind(authController),
);

authRoute.post(
    "/revoke",
    authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware),
    authController.revoke.bind(authController),
);

authRoute.post(
    "/logout",
    authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware),
    authController.logout.bind(authController),
);

authRoute.post(
    "/forgot-password",
    validationMiddleware.validate(forgotPasswordSchema),
    authController.forgotPassword.bind(authController),
);

authRoute.post(
    "/reset-password",
    validationMiddleware.validate(resetPasswordSchema),
    authController.resetPassword.bind(authController),
);

authRoute.post(
    "/verify-email",
    validationMiddleware.validate(emailVerificationSchema),
    authController.verifyEmail.bind(authController),
);

authRoute.post(
    "/resend-verification",
    validationMiddleware.validate(forgotPasswordSchema),
    authController.resendVerificationEmail.bind(authController),
);

export default authRoute;
