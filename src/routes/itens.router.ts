import { Router } from "express";
import Controller_Itens from "../controllers/Itens.controller";

const router_itens = Router();
const controller = new Controller_Itens();

router_itens.route("/itens").get(controller.list);
router_itens.route("/item").post(controller.create);
router_itens
  .route("/item/:id")
  .get(controller.get_id)
  .put(controller.update_by_id)
  .patch(controller.update_by_id)
  .delete(controller.remove_by_id)

export default router_itens;
