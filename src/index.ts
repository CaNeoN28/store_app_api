import express from "express";
import config_router from "./routes";
import error_handler from "./middlewares/error_handler.middleware";
import cookie_parser from "cookie-parser";
import * as dotenv from "dotenv";
import swagger_setup from "./docs/head";

const app = express();
dotenv.config();

app.use(express.json());
app.use(cookie_parser());
app.use(config_router());

swagger_setup(app);

app.use(error_handler);

app.listen(3000, () => {
  console.log(
    "Servidor iniciado. Disponível para acesso em http://localhost:" + 3000
  );
});
