import { Router } from "express";
import Controller_Itens from "../controllers/Itens.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_itens = Router();
const controller = new Controller_Itens();

router_itens
  .route("/itens")
  .get(authentication_middleware("ITEM"), controller.list);

router_itens
  .route("/item")
  .post(authentication_middleware("ITEM"), controller.create);

router_itens
  .route("/item/:id")
  .get(controller.get_id)
  .put(controller.update_by_id)
  .patch(controller.update_by_id)
  .delete(controller.remove_by_id);

export default router_itens;
