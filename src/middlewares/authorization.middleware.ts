import { TYPES } from "@/di/types";
import IMiddleware from "@/middlewares/IMiddleware";
import { type IAuthorizationService } from "@/services/authorization.service";
import type { ILoggerService } from "@/services/logger.service";
import { NextFunction, Request, Response } from "express-serve-static-core";
import { inject, injectable } from "inversify";

export interface AuthorizationOptions {
    permissions?: string[];
    roles?: string[];
    action?: string;
    resource?: string;
    requireAll?: boolean; // true = all permissions/roles required, false = any one required
}

export interface IAuthorizationMiddleware extends IMiddleware {
    requirePermissions(
        permissions: string[],
        requireAll?: boolean,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireRoles(
        roles: string[],
        requireAll?: boolean,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireAction(
        action: string,
        resource?: string,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createWithOptions(
        options: AuthorizationOptions,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

@injectable()
export default class AuthorizationMiddleware implements IAuthorizationMiddleware {
    constructor(
        @inject(TYPES.IAuthorizationService)
        private readonly authorizationService: IAuthorizationService,
        @inject(TYPES.ILoggerService)
        private readonly logger: ILoggerService,
    ) {}

    public handle(req: Request, res: Response, next: NextFunction): void {
        // This is a basic handle method that should not be used directly
        // Use the specific methods like requirePermissions, requireRoles, etc.
        res.status(403).json({
            success: false,
            data: null,
            message: "Authorization method not specified",
        });
    }

    /**
     * Create middleware that requires specific permissions
     * @param permissions Array of permission names to check
     * @param requireAll If true, user must have ALL permissions. If false, user needs ANY one permission
     */
    public requirePermissions(
        permissions: string[],
        requireAll = false,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void> {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            // User ID can come from req.body.user or req.body.user.id
            const userIdRaw = req.body.user?.id ?? req.body.user;
            const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : userIdRaw;

            if (!userId || isNaN(userId)) {
                res.status(401).json({
                    success: false,
                    data: null,
                    message: "Authentication required",
                });
                return;
            }

            try {
                const hasPermission = requireAll
                    ? await this.authorizationService.hasAllPermissions(userId, permissions)
                    : await this.authorizationService.hasAnyPermission(userId, permissions);

                if (!hasPermission) {
                    res.status(403).json({
                        success: false,
                        data: null,
                        message: "Insufficient permissions",
                    });
                    return;
                }

                next();
            } catch (error) {
                this.logger.error("Authorization error", { error });
                res.status(500).json({
                    success: false,
                    data: null,
                    message: "Authorization check failed",
                });
            }
        };
    }

    /**
     * Create middleware that requires specific roles
     * @param roles Array of role names to check
     * @param requireAll If true, user must have ALL roles. If false, user needs ANY one role
     */
    public requireRoles(
        roles: string[],
        requireAll = false,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void> {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            // User ID can come from req.body.user or req.body.user.id
            const userIdRaw = req.body.user?.id ?? req.body.user;
            const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : userIdRaw;

            if (!userId || isNaN(userId)) {
                res.status(401).json({
                    success: false,
                    data: null,
                    message: "Authentication required",
                });
                return;
            }

            try {
                const hasRole = requireAll
                    ? await this.authorizationService.hasAllRoles(userId, roles)
                    : await this.authorizationService.hasAnyRole(userId, roles);

                if (!hasRole) {
                    res.status(403).json({
                        success: false,
                        data: null,
                        message: "Insufficient role privileges",
                    });
                    return;
                }

                next();
            } catch (error) {
                this.logger.error("Authorization error", { error });
                res.status(500).json({
                    success: false,
                    data: null,
                    message: "Authorization check failed",
                });
            }
        };
    }

    /**
     * Create middleware that uses the high-level 'can' method
     * @param action The action to check (e.g., 'read', 'create', 'update', 'delete')
     * @param resource The resource to check (e.g., 'user', 'product')
     */
    public requireAction(
        action: string,
        resource?: string,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void> {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            // User ID can come from req.body.user or req.body.user.id
            const userIdRaw = req.body.user?.id ?? req.body.user;
            const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : userIdRaw;

            if (!userId || isNaN(userId)) {
                res.status(401).json({
                    success: false,
                    data: null,
                    message: "Authentication required",
                });
                return;
            }

            try {
                const canPerformAction = await this.authorizationService.can(userId, action, resource);

                if (!canPerformAction) {
                    res.status(403).json({
                        success: false,
                        data: null,
                        message: `Not authorized to ${action}${resource ? ` ${resource}` : ""}`,
                    });
                    return;
                }

                next();
            } catch (error) {
                this.logger.error("Authorization error", { error });
                res.status(500).json({
                    success: false,
                    data: null,
                    message: "Authorization check failed",
                });
            }
        };
    }

    /**
     * Create middleware with complex authorization options
     * @param options Authorization configuration object
     */
    public createWithOptions(
        options: AuthorizationOptions,
    ): (req: Request, res: Response, next: NextFunction) => Promise<void> {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            // User ID can come from req.body.user or req.body.user.id
            const userIdRaw = req.body.user?.id ?? req.body.user;
            const userId = typeof userIdRaw === "string" ? parseInt(userIdRaw, 10) : userIdRaw;

            if (!userId || isNaN(userId)) {
                res.status(401).json({
                    success: false,
                    data: null,
                    message: "Authentication required",
                });
                return;
            }

            try {
                let authorized = false;

                // Check action-based authorization first (highest priority)
                if (options.action) {
                    authorized = await this.authorizationService.can(userId, options.action, options.resource);
                }
                // Check permissions
                else if (options.permissions && options.permissions.length > 0) {
                    authorized = options.requireAll
                        ? await this.authorizationService.hasAllPermissions(userId, options.permissions)
                        : await this.authorizationService.hasAnyPermission(userId, options.permissions);
                }
                // Check roles
                else if (options.roles && options.roles.length > 0) {
                    authorized = options.requireAll
                        ? await this.authorizationService.hasAllRoles(userId, options.roles)
                        : await this.authorizationService.hasAnyRole(userId, options.roles);
                }
                // No authorization criteria specified - deny by default
                else {
                    authorized = false;
                }

                if (!authorized) {
                    res.status(403).json({
                        success: false,
                        data: null,
                        message: "Access denied",
                    });
                    return;
                }

                next();
            } catch (error) {
                this.logger.error("Authorization error", { error });
                res.status(500).json({
                    success: false,
                    data: null,
                    message: "Authorization check failed",
                });
            }
        };
    }
}
