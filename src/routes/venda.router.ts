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
  .route("/venda/:id")
  .get(authentication_middleware("VENDA"), controller.get_id);

router_vendas
  .route("/resumo-vendas")
  .get(authentication_middleware("VENDA"), controller.resumo);

router_vendas
  .route("/cliente/:id/listar-vendas")
  .get(authentication_middleware("VENDA"), controller.list_cliente);

router_vendas
  .route("/cliente/:id/resumo-vendas")
  .get(authentication_middleware("VENDA"), controller.resumo_cliente);

router_vendas
  .route("/item/:id/listar-vendas")
  .get(authentication_middleware("VENDA"), controller.list_item);

router_vendas
  .route("/item/:id/resumo-vendas")
  .get(authentication_middleware("VENDA"), controller.resumo_cliente);

export default router_vendas;
