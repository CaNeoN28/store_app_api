import { Application } from "express";
import swaggerJSDoc, { Options, SwaggerDefinition } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swagger_definition: SwaggerDefinition = {
  info: {
    title: "App Store API",
    version: "1.0.0",
  },
};

const swagger_options: Options = {
  definition: swagger_definition,
  apis: [],
};

export default function swagger_setup(app: Application) {
  const swagger_doc = swaggerJSDoc(swagger_options);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swagger_doc));
}
