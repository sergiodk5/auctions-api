import { SENDGRID_API_KEY, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_SECURE, SMTP_USER } from "@/config/env";
import AuthController, { IAuthController } from "@/controllers/auth.controller";
import UsersController, { IUsersController } from "@/controllers/users.controller";
import { TYPES } from "@/di/types";
import AuthGuardMiddleware from "@/middlewares/auth.guard";
import IMiddleware from "@/middlewares/IMiddleware";
import LoginRateLimiter from "@/middlewares/login-rate-limiter";
import RefreshRateLimiter from "@/middlewares/refresh-rate-limiter";
import { IValidationMiddleware, ValidationMiddleware } from "@/middlewares/validation.middleware";
import TokenRepository, { ITokenRepository } from "@/repositories/token.repository";
import UserRepository, { IUserRepository } from "@/repositories/user.repository";
import AuthService, { IAuthService } from "@/services/auth.service";
import CacheService, { ICacheService } from "@/services/cache.service";
import DatabaseService, { IDatabaseService } from "@/services/database.service";
import { IMailerService } from "@/services/IMailerService";
import { MailerService } from "@/services/mailer.service";
import UserService, { type IUserService } from "@/services/user.service";
import ValidationService, { IValidationService } from "@/services/validation.service";
import { Container } from "inversify";
import nodemailer from "nodemailer";
import nodemailerSendgrid from "nodemailer-sendgrid";

const container = new Container({ defaultScope: "Singleton" });

container
    .bind<import("nodemailer").Transporter>(TYPES.MailerTransporter)
    .toDynamicValue(() => {
        if (process.env.NODE_ENV === "production" && process.env.MAILER_PROVIDER === "sendgrid") {
            // SendGrid via API
            return nodemailer.createTransport(
                nodemailerSendgrid({
                    apiKey: SENDGRID_API_KEY,
                }),
            );
        }
        // Default → SMTP (e.g. MailHog in dev, or any other SMTP server)
        return nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT),
            secure: SMTP_SECURE,
            auth: SMTP_USER
                ? {
                      user: SMTP_USER,
                      pass: SMTP_PASS,
                  }
                : undefined,
        });
    })
    .inSingletonScope();

// Database
container.bind<IDatabaseService>(TYPES.IDatabaseService).to(DatabaseService);
container.bind<ICacheService>(TYPES.ICacheService).to(CacheService);

// Repositories
container.bind<ITokenRepository>(TYPES.ITokenRepository).to(TokenRepository);
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository);

// Services
container.bind<IUserService>(TYPES.IUserService).to(UserService);
container.bind<IAuthService>(TYPES.IAuthService).to(AuthService);
container.bind<IValidationService>(TYPES.IValidationService).to(ValidationService);

container.bind<IMailerService>(TYPES.IMailerService).to(MailerService);

// Controllers
container.bind<IUsersController>(TYPES.IUsersController).to(UsersController);
container.bind<IAuthController>(TYPES.IAuthController).to(AuthController);

// Middleware
container.bind<IMiddleware>(TYPES.IAuthGuardMiddleware).to(AuthGuardMiddleware);
container.bind<IMiddleware>(TYPES.IRefreshRateLimiter).to(RefreshRateLimiter);
container.bind<IMiddleware>(TYPES.ILoginRateLimiter).to(LoginRateLimiter);
container.bind<IValidationMiddleware>(TYPES.IValidationMiddleware).to(ValidationMiddleware);

export default container;
