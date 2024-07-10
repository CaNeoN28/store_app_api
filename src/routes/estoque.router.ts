import { Router } from "express";
import Estoque_Controller from "../controllers/Estoque.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_estoque = Router();
const controller = new Estoque_Controller();

router_estoque
  .route("/itens/estoque")
  .get(authentication_middleware("ESTOQUE"), controller.list);

router_estoque
  .route("/item/:id/estoque")
  .get(authentication_middleware("ESTOQUE"), controller.get_id)
  .patch(authentication_middleware("ESTOQUE"), controller.update_by_id)
  .put(authentication_middleware("ESTOQUE"), controller.update_by_id);

export default router_estoque;
