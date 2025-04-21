import dotenv from "dotenv";

dotenv.config();

export const SERVER_PORT = process.env.PORT ?? 8090;
export const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres';