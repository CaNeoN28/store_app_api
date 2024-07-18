import { Application } from "express";
import swaggerJSDoc, { OAS3Definition, Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import paths from "./paths";
import components from "./components";

const API_URL = process.env.API_URL || "";

const swagger_definition: OAS3Definition = {
  openapi: "3.0.0",
  info: {
    title: "App Store API",
    version: "1.0.0",
  },
  servers: [
    {
      url: API_URL,
      description: "Servidor da API",
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths,
  components,
};

const swagger_options: Options = {
  definition: swagger_definition,
  apis: [],
};

export default function swagger_setup(app: Application) {
  const swagger_doc = swaggerJSDoc(swagger_options);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swagger_doc));
}
