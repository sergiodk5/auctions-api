import dotenv from "dotenv";

dotenv.config();

export const getEnv = (key: string, defaultValue: string): string => {
    const value = process.env[key] ?? defaultValue;

    if (!value) {
        throw new Error(`Environment variable ${key} is not defined`);
    }

    return value;
};

export const getEnvOptional = (key: string, defaultValue: string = ""): string => {
    return process.env[key] ?? defaultValue;
};

export const SERVER_PORT = getEnv("PORT", "8090");
export const DATABASE_URL = getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/postgres");
export const REDIS_HOST = getEnv("REDIS_HOST", "localhost");
export const REDIS_PORT = getEnv("REDIS_PORT", "6379");
export const REDIS_PASSWORD = getEnvOptional("REDIS_PASSWORD", "");
export const JWT_SECRET = getEnv("JWT_SECRET", "your_jwt_secret");
export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET", "    ");
export const ACCESS_LIFETIME = "15m";
export const REFRESH_IDLE_TTL = 7 * 24 * 3600; // seconds
export const REFRESH_ABSOLUTE_TTL = 30 * 24 * 3600; // seconds

export const SMTP_HOST = getEnv("SMTP_HOST", "mailhog");
export const SMTP_PORT = getEnv("SMTP_PORT", "1025");
export const SMTP_SECURE = getEnv("SMTP_SECURE", "false") === "true";
export const SMTP_USER = getEnv("SMTP_USER", "user");
export const SMTP_PASS = getEnv("SMTP_PASS", "password");

export const MAILER_PROVIDER = getEnv("MAILER_PROVIDER", "sendgrid");
export const SENDGRID_API_KEY = getEnv("SENDGRID_API_KEY", "your-sendgrid-api-key");

export const JWT_RESET_SECRET = getEnv("JWT_RESET_SECRET", "your_jwt_reset_secret");
export const RESET_PASSWORD_TTL = 3600;
export const FRONTEND_URL = getEnv("FRONTEND_URL", "http://localhost:3000");

export const NODE_ENV = getEnv("NODE_ENV", "development");
export const MAILER_FROM_DOMAIN = getEnv("MAILER_FROM_DOMAIN", "localhost");
export const TEST_DATABASE_URL = getEnv(
    "TEST_DATABASE_URL",
    "postgres://postgres:postgres@localhost:5432/postgres_test",
);
