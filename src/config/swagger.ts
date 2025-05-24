import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

// Load the OpenAPI specification from YAML file
const swaggerDocument = YAML.load(path.join(__dirname, "../../docs/openapi.yaml"));

export const setupSwagger = (app: Express): void => {
    app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
            explorer: true,
            customCss: `
            .swagger-ui .topbar { display: none; }
            .swagger-ui .info { margin: 50px 0; }
            .swagger-ui .scheme-container { margin: 50px 0; }
        `,
            customSiteTitle: "Auctions API Documentation",
        }),
    );
};

export default swaggerDocument;
