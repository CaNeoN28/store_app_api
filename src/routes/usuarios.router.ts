import { Router } from "express";
import Controller_Usuarios from "../controllers/Usuarios.controller";
import authentication_middleware from "../middlewares/authentication.middleware";
import Image_Handler from "../middlewares/Image_handlers";

const router_usuarios = Router();
const controller = new Controller_Usuarios();

router_usuarios
  .route("/usuarios")
  .get(authentication_middleware("USUARIO"), controller.list);
router_usuarios
  .route("/usuario")
  .post(authentication_middleware("USUARIO"), controller.create);

router_usuarios
  .route("/usuario/:id")
  .get(authentication_middleware("USUARIO"), controller.get_id)
  .patch(authentication_middleware("USUARIO"), controller.update_by_id)
  .put(authentication_middleware("USUARIO"), controller.update_by_id)
  .delete(authentication_middleware("USUARIO"), controller.remove_by_id);

router_usuarios
  .route("/usuarios/imagens/:caminho")
  .get(Image_Handler.get_image("usuarios"));

export default router_usuarios;
