import { Router } from "express";
import Controller_Compras from "../controllers/Compras.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_compras = Router();
const controller = new Controller_Compras();

router_compras
  .route("/realizar-compra")
  .post(authentication_middleware("COMPRA"), controller.create);

router_compras
  .route("/listar-compras")
  .get(authentication_middleware("COMPRA"), controller.list);

router_compras
  .route("/resumo-compras")
  .get(authentication_middleware("COMPRA"), controller.resumo);

router_compras
  .route("/visualizar-compra/:id")
  .get(authentication_middleware("COMPRA"), controller.get_id);

router_compras
  .route("/fornecedor/:id/listar-compras")
  .get(authentication_middleware("COMPRA"), controller.list_fornecedor);

router_compras
  .route("/fornecedor/:id/resumo-compras")
  .get(authentication_middleware("COMPRA"), controller.resumo_fornecedor);

router_compras
  .route("/item/:id/listar-compras")
  .get(authentication_middleware("COMPRA"), controller.list_item);

router_compras
  .route("/item/:id/resumo-compras")
  .get(authentication_middleware("COMPRA"), controller.resumo_item);

export default router_compras;
