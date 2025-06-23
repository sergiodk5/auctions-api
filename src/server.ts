import app from "@/app";
import { SERVER_PORT } from "@/config/env";
import container from "@/di/container";
import { TYPES } from "@/di/types";
import type { ILoggerService } from "@/services/logger.service";
import "module-alias/register";

const logger = container.get<ILoggerService>(TYPES.ILoggerService);

app.listen(SERVER_PORT, () => {
    logger.info(`Server running on port ${SERVER_PORT.toString()}`);
});
