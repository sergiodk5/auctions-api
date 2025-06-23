import { IAuthController } from "@/controllers/auth.controller";
import { IUsersController } from "@/controllers/users.controller";
import { TYPES } from "@/di/types";
import { IAuthorizationMiddleware } from "@/middlewares/authorization.middleware";
import IMiddleware from "@/middlewares/IMiddleware";
import { IValidationMiddleware } from "@/middlewares/validation.middleware";
import { IEmailVerificationRepository } from "@/repositories/email-verification.repository";
import { IPermissionRepository } from "@/repositories/permission.repository";
import { IRoleRepository } from "@/repositories/role.repository";
import { ITokenRepository } from "@/repositories/token.repository";
import { IUserPermissionRepository } from "@/repositories/user-permission.repository";
import { IUserRoleRepository } from "@/repositories/user-role.repository";
import { IUserRepository } from "@/repositories/user.repository";
import { IAuthenticationService } from "@/services/authentication.service";
import { IAuthorizationService } from "@/services/authorization.service";
import { ICacheService } from "@/services/cache.service";
import { IDatabaseService } from "@/services/database.service";
import { IMailerService } from "@/services/IMailerService";
import { IPermissionService } from "@/services/permission.service";
import { IUserService } from "@/services/user.service";
import { IValidationService } from "@/services/validation.service";
import { Container } from "inversify";

// Import the actual implementations we want to use
import AuthController from "@/controllers/auth.controller";
import UsersController from "@/controllers/users.controller";
import AuthenticationGuardMiddleware from "@/middlewares/authentication.guard";
import AuthorizationMiddleware from "@/middlewares/authorization.middleware";
import LoginRateLimiter from "@/middlewares/login-rate-limiter";
import RefreshRateLimiter from "@/middlewares/refresh-rate-limiter";
import RefreshTokenGuardMiddleware from "@/middlewares/refresh-token.guard";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { EmailVerificationRepository } from "@/repositories/email-verification.repository";
import PermissionRepository from "@/repositories/permission.repository";
import RoleRepository from "@/repositories/role.repository";
import TokenRepository from "@/repositories/token.repository";
import UserPermissionRepository from "@/repositories/user-permission.repository";
import UserRoleRepository from "@/repositories/user-role.repository";
import UserRepository from "@/repositories/user.repository";
import AuthenticationService from "@/services/authentication.service";
import AuthorizationService from "@/services/authorization.service";
import CacheService from "@/services/cache.service";
import { MailerService } from "@/services/mailer.service";
import PermissionService from "@/services/permission.service";
import UserService from "@/services/user.service";
import ValidationService from "@/services/validation.service";

// Import test implementations
import { TestDatabaseService } from "./test-database.service";
import { TestMailerTransporter } from "./test-mailer.helper";

/**
 * Creates a test-specific DI container with real services but test database
 */
export function createTestContainer(): Container {
    const container = new Container({ defaultScope: "Singleton" });

    // Test-specific services
    container.bind<IDatabaseService>(TYPES.IDatabaseService).to(TestDatabaseService);
    container.bind<ICacheService>(TYPES.ICacheService).to(CacheService);

    // Mailer transporter - use test transporter
    container.bind<import("nodemailer").Transporter>(TYPES.MailerTransporter).toDynamicValue(() => {
        const testTransporter = new TestMailerTransporter();
        return testTransporter.getTransporter();
    });

    // Repositories - use real implementations
    container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository);
    container.bind<IPermissionRepository>(TYPES.IPermissionRepository).to(PermissionRepository);
    container.bind<IRoleRepository>(TYPES.IRoleRepository).to(RoleRepository);
    container.bind<IUserRoleRepository>(TYPES.IUserRoleRepository).to(UserRoleRepository);
    container.bind<IUserPermissionRepository>(TYPES.IUserPermissionRepository).to(UserPermissionRepository);
    container.bind<ITokenRepository>(TYPES.ITokenRepository).to(TokenRepository);
    container.bind<IEmailVerificationRepository>(TYPES.IEmailVerificationRepository).to(EmailVerificationRepository);

    // Services - use real implementations
    container.bind<IUserService>(TYPES.IUserService).to(UserService);
    container.bind<IAuthenticationService>(TYPES.IAuthenticationService).to(AuthenticationService);
    container.bind<IAuthorizationService>(TYPES.IAuthorizationService).to(AuthorizationService);
    container.bind<IPermissionService>(TYPES.IPermissionService).to(PermissionService);
    container.bind<IValidationService>(TYPES.IValidationService).to(ValidationService);
    container.bind<IMailerService>(TYPES.IMailerService).to(MailerService);

    // Controllers - use real implementations
    container.bind<IUsersController>(TYPES.IUsersController).to(UsersController);
    container.bind<IAuthController>(TYPES.IAuthController).to(AuthController);

    // Middleware - use real implementations
    container.bind<IMiddleware>(TYPES.IAuthenticationGuardMiddleware).to(AuthenticationGuardMiddleware);
    container.bind<IAuthorizationMiddleware>(TYPES.IAuthorizationMiddleware).to(AuthorizationMiddleware);
    container.bind<IMiddleware>(TYPES.IRefreshRateLimiter).to(RefreshRateLimiter);
    container.bind<IMiddleware>(TYPES.ILoginRateLimiter).to(LoginRateLimiter);
    container
        .bind<IMiddleware>(TYPES.IRefreshTokenGuardMiddleware)
        .to(RefreshTokenGuardMiddleware);
    container.bind<IValidationMiddleware>(TYPES.IValidationMiddleware).to(ValidationMiddleware);

    return container;
}

/**
 * Global test container instance
 */
let testContainer: Container | null = null;

/**
 * Get or create the test container
 */
export function getTestContainer(): Container {
    testContainer ??= createTestContainer();
    return testContainer;
}

/**
 * Reset the test container (useful for cleanup)
 */
export function resetTestContainer(): void {
    testContainer = null;
}
