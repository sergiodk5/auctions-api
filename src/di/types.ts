const TYPES = {
    ITokenRepository: Symbol.for("ITokenRepository"),
    IUserRepository: Symbol.for("IUserRepository"),
    IEmailVerificationRepository: Symbol.for("IEmailVerificationRepository"),
    IPermissionRepository: Symbol.for("IPermissionRepository"),
    IRoleRepository: Symbol.for("IRoleRepository"),
    IUserRoleRepository: Symbol.for("IUserRoleRepository"),
    IUserPermissionRepository: Symbol.for("IUserPermissionRepository"),

    IDatabaseService: Symbol.for("IDatabaseService"),
    ICacheService: Symbol.for("ICacheService"),
    IValidationService: Symbol.for("IValidationService"),

    IUserService: Symbol.for("IUserService"),
    IAuthenticationService: Symbol.for("IAuthenticationService"),
    IPermissionService: Symbol.for("IPermissionService"),
    IAuthorizationService: Symbol.for("IAuthorizationService"),

    IMailerService: Symbol.for("IMailerService"),
    MailerTransporter: Symbol.for("MailerTransporter"),

    IUsersController: Symbol.for("IUsersController"),
    IAuthController: Symbol.for("IAuthController"),

    IAuthGuardMiddleware: Symbol.for("IAuthGuardMiddleware"),
    IRefreshRateLimiter: Symbol.for("IRefreshRateLimiter"),
    ILoginRateLimiter: Symbol.for("ILoginRateLimiter"),
    IValidationMiddleware: Symbol.for("IValidationMiddleware"),
};

export { TYPES };
