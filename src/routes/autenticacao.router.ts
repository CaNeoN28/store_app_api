import { Router } from "express";
import Controller_Autenticacao from "../controllers/Autenticacao.controller";
import authentication_middleware from "../middlewares/authentication.middleware";
import Image_Handler from "../middlewares/Image_handlers";
import fileUpload from "express-fileupload";

const router_autenticacao = Router();
const controller = new Controller_Autenticacao();

router_autenticacao.route("/login").post(controller.realizar_login);

router_autenticacao
  .route("/perfil")
  .get(authentication_middleware(), controller.visualizar_perfil);

router_autenticacao
  .route("/perfil/edicao")
  .all(authentication_middleware())
  .patch(controller.alterar_perfil);

router_autenticacao
  .route("/perfil/atualizar-imagem")
  .all(
    fileUpload({
      useTempFiles: true,
      tempFileDir: "/tmp/",
    })
  )
  .all(authentication_middleware())
  .post(Image_Handler.insert_image("usuario"), controller.atualizar_imagem);

export default router_autenticacao;
