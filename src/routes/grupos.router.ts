import { Router } from "express";
import Controller_Grupos from "../controllers/Grupos.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_grupos = Router();
const controller = new Controller_Grupos();

router_grupos
  .route("/grupos")
  .all(authentication_middleware("GRUPO"))
  .get(controller.list);

router_grupos
  .route("/grupo")
  .all(authentication_middleware("GRUPO"))
  .post(controller.create);

router_grupos
  .route("/grupo/:id")
  .all(authentication_middleware("GRUPO"))
  .get(controller.get_id)
  .patch(controller.update_by_id)
  .put(controller.update_by_id)
  .delete(controller.remove_by_id);

export default router_grupos;
