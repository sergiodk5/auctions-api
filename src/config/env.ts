import dotenv from "dotenv";

dotenv.config();

export const getEnv = (key: string, defaultValue: string): string => {
    const value = process.env[key] ?? defaultValue;

    if (!value) {
        throw new Error(`Environment variable ${key} is not defined`);
    }

    return value;
};

export const SERVER_PORT = getEnv("PORT", "8090");
export const DATABASE_URL = getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/postgres");
export const REDIS_HOST = getEnv("REDIS_HOST", "localhost");
export const REDIS_PORT = getEnv("REDIS_PORT", "6379");
export const REDIS_PASSWORD = getEnv("REDIS_PASSWORD", "redispassword");
export const JWT_SECRET = getEnv("JWT_SECRET", "your_jwt_secret");
export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET", "your_jwt_refresh_secret");
export const ACCESS_LIFETIME = "15m";
export const REFRESH_IDLE_TTL = 7 * 24 * 3600; // seconds
export const REFRESH_ABSOLUTE_TTL = 30 * 24 * 3600; // seconds
