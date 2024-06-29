import express from "express";
import config_router from "./routes";
import errorHandler from "./middlewares/errorHandler.middleware";

const app = express();

app.use(express.json());
app.use(config_router());
app.use(errorHandler);

app.listen(3000, () => {
  console.log(
    "Servidor iniciado. Disponível para acesso em http://localhost:" + 3000
  );
});
