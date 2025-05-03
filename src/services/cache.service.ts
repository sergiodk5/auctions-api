import { injectable } from "inversify";
import { createClient, RedisClientType } from "redis";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "@/config/env";

export interface ICacheService {
    client: RedisClientType;
}

@injectable()
export default class CacheService implements ICacheService {
    public readonly client: RedisClientType;

    constructor() {
        if (process.env.NODE_ENV === "test") {
            // stub for tests
            this.client = {} as RedisClientType;
        } else {
            this.client = createClient({
                socket: {
                    host: REDIS_HOST,
                    port: Number(REDIS_PORT),
                },
                password: REDIS_PASSWORD,
            });
            this.client.on("error", (err: unknown) => {
                console.error("Redis Client Error", err);
            });
            this.client.connect().catch((err: unknown) => {
                console.error("Redis Client Connection Error", err);
            });
            this.client.on("connect", () => {
                console.log("Redis Client Connected");
            });
        }
    }
}
