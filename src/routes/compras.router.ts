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
  .route("/listar-compras/:fornecedor_id")
  .get(authentication_middleware("COMPRA"), controller.list_fornecedor);

router_compras
  .route("/visualizar-compra/:id")
  .get(authentication_middleware("COMPRA"), controller.get_id);

export default router_compras;
