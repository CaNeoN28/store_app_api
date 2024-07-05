import { Router } from "express";
import Controller_Unidades from "../controllers/Unidades.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_unidades = Router();
const controller = new Controller_Unidades();

router_unidades.route("/unidades").get(controller.list);

router_unidades
  .route("/unidade")
  .all(authentication_middleware("UNIDADE"))
  .post(controller.create);

router_unidades
  .route("/unidade/:id")
  .get(controller.get_id)
  .patch(authentication_middleware("UNIDADE"), controller.update_by_id)
  .put(authentication_middleware("UNIDADE"), controller.update_by_id)
  .delete(authentication_middleware("UNIDADE"), controller.remove_by_id);

export default router_unidades;
