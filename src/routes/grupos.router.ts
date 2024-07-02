import { Router } from "express";
import Controller_Grupos from "../controllers/Grupos.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_grupos = Router();
const controller = new Controller_Grupos();

router_grupos
  .route("/grupos")
  .get(authentication_middleware("GRUPO"), controller.list);

router_grupos
  .route("/grupo")
  .post(authentication_middleware("GRUPO"), controller.create);
  
router_grupos
  .route("/grupo/:id")
  .patch(authentication_middleware("GRUPO"), controller.update_by_id)
  .put(authentication_middleware("GRUPO"), controller.update_by_id)
  .delete(authentication_middleware("GRUPO"), controller.remove_by_id);

export default router_grupos;
