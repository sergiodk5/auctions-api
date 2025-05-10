import { MAILER_PROVIDER, NODE_ENV } from "@/config/env";
import AuthController, { IAuthController } from "@/controllers/auth.controller";
import UsersController, { IUsersController } from "@/controllers/users.controller";
import { TYPES } from "@/di/types";
import AuthGuardMiddleware from "@/middlewares/auth.guard";
import IMiddleware from "@/middlewares/IMiddleware";
import LoginRateLimiter from "@/middlewares/LoginRateLimiter";
import RefreshRateLimiter from "@/middlewares/RefreshRateLimiter";
import { IValidationMiddleware, ValidationMiddleware } from "@/middlewares/ValidationMiddleware";
import TokenRepository, { ITokenRepository } from "@/repositories/TokenRepository";
import UserRepository, { IUserRepository } from "@/repositories/UserRepository";
import AuthService, { IAuthService } from "@/services/auth.service";
import CacheService, { ICacheService } from "@/services/cache.service";
import DatabaseService, { IDatabaseService } from "@/services/database.service";
import { IMailer } from "@/services/IMailer";
import { LocalMailer } from "@/services/LocalMailer";
import { SendGridMailer } from "@/services/SendGridMailer";
import UserService, { type IUserService } from "@/services/user.service";
import ValidationService, { IValidationService } from "@/services/validation.service";
import { Container } from "inversify";

const container = new Container({ defaultScope: "Singleton" });

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

container
    .bind<IMailer>(TYPES.IMailerService)
    .toDynamicValue(() => {
        if (NODE_ENV === "production" && MAILER_PROVIDER === "sendgrid") {
            return new SendGridMailer();
        }
        return new LocalMailer();
    })
    .inSingletonScope();

// Controllers
container.bind<IUsersController>(TYPES.IUsersController).to(UsersController);
container.bind<IAuthController>(TYPES.IAuthController).to(AuthController);

// Middleware
container.bind<IMiddleware>(TYPES.IAuthGuardMiddleware).to(AuthGuardMiddleware);
container.bind<IMiddleware>(TYPES.IRefreshRateLimiter).to(RefreshRateLimiter);
container.bind<IMiddleware>(TYPES.ILoginRateLimiter).to(LoginRateLimiter);
container.bind<IValidationMiddleware>(TYPES.IValidationMiddleware).to(ValidationMiddleware);

export default container;
