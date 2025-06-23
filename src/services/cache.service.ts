import { NODE_ENV, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "@/config/env";
import { TYPES } from "@/di/types";
import type { ILoggerService } from "@/services/logger.service";
import { inject, injectable } from "inversify";
import { createClient, RedisClientType } from "redis";

export interface ICacheService {
    client: RedisClientType;
}

@injectable()
export default class CacheService implements ICacheService {
    public readonly client: RedisClientType;

    constructor(
        @inject(TYPES.ILoggerService)
        private readonly logger: ILoggerService,
    ) {
        if (NODE_ENV === "test") {
            // Mock Redis client for tests with all required methods
            this.client = {
                get: () => Promise.resolve(null),
                set: () => Promise.resolve("OK"),
                setEx: () => Promise.resolve("OK"),
                del: () => Promise.resolve(1),
                exists: () => Promise.resolve(0),
                expire: () => Promise.resolve(1),
                ttl: () => Promise.resolve(-1),
                flushAll: () => Promise.resolve("OK"),
                quit: () => Promise.resolve("OK"),
                disconnect: () => Promise.resolve(undefined),
                keys: () => Promise.resolve([]),
                isOpen: true,
                isReady: true,
            } as any as RedisClientType;
        } else {
            this.client = createClient({
                socket: {
                    host: REDIS_HOST,
                    port: Number(REDIS_PORT),
                },
                password: REDIS_PASSWORD,
            });
            this.client.on("error", (err: unknown) => {
                this.logger.error("Redis Client Error", { error: err });
            });
            this.client.connect().catch((err: unknown) => {
                this.logger.error("Redis Client Connection Error", { error: err });
            });
            this.client.on("connect", () => {
                this.logger.info("Redis Client Connected");
            });
        }
    }
}
