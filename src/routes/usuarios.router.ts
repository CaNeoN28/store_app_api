import { Router } from "express";
import Controller_Usuarios from "../controllers/Usuarios.controller";
import authentication_middleware from "../middlewares/authentication.middleware";
import Image_Handler from "../middlewares/Image_handlers";
import fileUpload from "express-fileupload";

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
  .all(authentication_middleware("USUARIO"))
  .get(controller.get_id)
  .patch(controller.update_by_id)
  .put(controller.update_by_id)
  .delete(controller.remove_by_id);

router_usuarios
  .route("/usuarios/imagens/:caminho")
  .get(Image_Handler.get_image("usuarios"));

router_usuarios
  .route("/usuario/:id/imagem")
  .all(authentication_middleware("USUARIO"))
  .all(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
  }))
  .post(Image_Handler.insert_image("usuarios"), controller.inserir_imagem);

export default router_usuarios;
