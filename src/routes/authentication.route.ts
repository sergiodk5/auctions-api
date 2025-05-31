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

const authenticationRoute = Router();

authenticationRoute.post(
    "/register",
    validationMiddleware.validate(createUserSchema),
    authController.register.bind(authController),
);

authenticationRoute.post(
    "/login",
    loginRateLimiter.handle.bind(loginRateLimiter),
    validationMiddleware.validate(loginSchema),
    authController.login.bind(authController),
);

authenticationRoute.post(
    "/refresh",
    refreshRateLimiter.handle.bind(refreshRateLimiter),
    authController.refresh.bind(authController),
);

authenticationRoute.post(
    "/revoke",
    authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware),
    authController.revoke.bind(authController),
);

authenticationRoute.post(
    "/logout",
    authenticationGuardMiddleware.handle.bind(authenticationGuardMiddleware),
    authController.logout.bind(authController),
);

authenticationRoute.post(
    "/forgot-password",
    validationMiddleware.validate(forgotPasswordSchema),
    authController.forgotPassword.bind(authController),
);

authenticationRoute.post(
    "/reset-password",
    validationMiddleware.validate(resetPasswordSchema),
    authController.resetPassword.bind(authController),
);

authenticationRoute.post(
    "/verify-email",
    validationMiddleware.validate(emailVerificationSchema),
    authController.verifyEmail.bind(authController),
);

authenticationRoute.post(
    "/resend-verification",
    validationMiddleware.validate(forgotPasswordSchema),
    authController.resendVerificationEmail.bind(authController),
);

export default authenticationRoute;
