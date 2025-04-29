import { REDIS_URL } from "@/config/env";
import { createClient, RedisClientType } from "redis";

let client: RedisClientType;

if (process.env.NODE_ENV === "test") {
    // Dummy stub; your tests will mock the methods they need.
    client = {} as RedisClientType;
} else {
    client = createClient({
        url: REDIS_URL,
    });

    client.on("error", (err) => {
        console.error("Redis Client Error", err);
    });
    client.connect().catch((err: unknown) => {
        console.error("Redis Client Connection Error", err);
    });
    client.on("connect", () => {
        console.log("Redis Client Connected");
    });
}

export default client;
