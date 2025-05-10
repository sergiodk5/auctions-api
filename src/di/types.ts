const TYPES = {
    ITokenRepository: Symbol.for("ITokenRepository"),
    IUserRepository: Symbol.for("IUserRepository"),

    IDatabaseService: Symbol.for("IDatabaseService"),
    ICacheService: Symbol.for("ICacheService"),
    IValidationService: Symbol.for("IValidationService"),

    IUserService: Symbol.for("IUserService"),
    IAuthService: Symbol.for("IAuthService"),

    IMailerService: Symbol.for("IMailerService"),

    IUsersController: Symbol.for("IUsersController"),
    IAuthController: Symbol.for("IAuthController"),

    IAuthGuardMiddleware: Symbol.for("IAuthGuardMiddleware"),
    IRefreshRateLimiter: Symbol.for("IRefreshRateLimiter"),
    ILoginRateLimiter: Symbol.for("ILoginRateLimiter"),
    IValidationMiddleware: Symbol.for("IValidationMiddleware"),
};

export { TYPES };
