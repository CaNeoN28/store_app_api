import { Router } from "express";
import Controller_Perdas from "../controllers/Perdas.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_perdas = Router();
const controller = new Controller_Perdas();

router_perdas
  .route("/listar-perdas")
  .get(authentication_middleware("PERDA"), controller.list);

router_perdas
  .route("/adicionar-perda")
  .post(authentication_middleware("PERDA"), controller.create);

export default router_perdas;
