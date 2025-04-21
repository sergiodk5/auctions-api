import "module-alias/register";
import app from "@/app";
import { SERVER_PORT } from "@/config/env";

app.listen(SERVER_PORT, () => {
    console.log(`Server running on ${SERVER_PORT.toString()}`);
});
