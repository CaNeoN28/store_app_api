import { Router } from "express";
import Controller_Vendas from "../controllers/Vendas.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_vendas = Router();
const controller = new Controller_Vendas();

router_vendas
  .route("/criar-venda")
  .post(authentication_middleware("VENDA"), controller.create);

router_vendas
  .route("/listar-vendas")
  .get(authentication_middleware("VENDA"), controller.list);

export default router_vendas;
