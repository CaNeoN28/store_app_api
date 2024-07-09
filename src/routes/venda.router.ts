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

router_vendas
  .route("/listar-vendas/:cliente_id")
  .get(authentication_middleware("VENDA"), controller.list_cliente);

router_vendas
  .route("/venda/:id")
  .get(authentication_middleware("VENDA"), controller.get_id);

router_vendas
  .route("/resumo-vendas")
  .get(authentication_middleware("VENDA"), controller.resumo);

export default router_vendas;
