import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string, defaultValue: string): string => {
    const value = process.env[key] ?? defaultValue;

    if (!value) {
        throw new Error(`Environment variable ${key} is not defined`);
    }

    return value;
};

export const SERVER_PORT = getEnv("PORT", "8090");
export const DATABASE_URL = getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/postgres");
export const JWT_SECRET = getEnv("JWT_SECRET", "your_jwt_secret");
export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET", "your_jwt_refresh_secret");
