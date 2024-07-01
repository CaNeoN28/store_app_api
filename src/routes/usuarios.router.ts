import { Router } from "express";
import Controller_Usuarios from "../controllers/Usuarios.controller";

const router_usuarios = Router();
const controller = new Controller_Usuarios();

router_usuarios.route("/usuarios").get(controller.list);
router_usuarios.route("/usuario").post(controller.create);

router_usuarios
  .route("/usuario/:id")
  .get(controller.get_id)
  .patch(controller.update_by_id)
  .put(controller.update_by_id)
  .delete(controller.remove_by_id);

export default router_usuarios;
