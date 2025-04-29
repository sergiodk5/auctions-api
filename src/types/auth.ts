import { User } from "@/types/user";
import { Request, Response, NextFunction } from "express-serve-static-core";
import { JwtPayload } from "jsonwebtoken";

export interface JwtAccessPayload extends JwtPayload {
    sub: string; // User ID
    jti: string; // JWT ID
}

export interface JwtRefreshPayload extends JwtPayload {
    family_id: string; // Refresh token family ID
}

export interface AuthUser {
    id: string; // Maps from sub in JwtAccessPayload
    jti: string; // Maps from jti in JwtAccessPayload\
}

export interface AuthTokensDto {
    accessToken: string;
    refreshToken: string;
}

export interface AuthLoginDto extends AuthTokensDto {
    user: User;
}

// export interface AuthRequest extends Request {
//     user: AuthUser; // User information extracted from the JWT
// }
