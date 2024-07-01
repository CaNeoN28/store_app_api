import { Router } from "express";
import Controller_Grupos from "../controllers/Grupos.controller";

const router_grupos = Router();
const controller = new Controller_Grupos();

router_grupos.route("/grupos").get(controller.list);
router_grupos.route("/grupo").post(controller.create);
router_grupos
  .route("/grupo/:id")
  .patch(controller.update_by_id)
  .put(controller.update_by_id)
  .delete(controller.remove_by_id)

export default router_grupos;
