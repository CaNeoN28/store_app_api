import { Router } from "express";
import Controller_Fornecedor from "../controllers/Fornecedores.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_fornecedor = Router();
const controller = new Controller_Fornecedor();

router_fornecedor
  .route("/fornecedores")
  .all(authentication_middleware("FORNECEDOR"))
  .get(controller.list);

router_fornecedor
  .route("/fornecedor")
  .all(authentication_middleware("FORNECEDOR"))
  .post(controller.create);

router_fornecedor
  .route("/fornecedor/:id")
  .all(authentication_middleware("FORNECEDOR"))
  .get(controller.get_id)
  .patch(controller.update_by_id)
  .put(controller.update_by_id)
  .delete(controller.remove_by_id);

export default router_fornecedor;
