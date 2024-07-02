import { Router } from "express";
import Controller_Autenticacao from "../controllers/Autenticacao.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_autenticacao = Router();
const controller = new Controller_Autenticacao();

router_autenticacao.route("/login").post(controller.realizar_login);
router_autenticacao
  .route("/perfil")
  .get(authentication_middleware, controller.visualizar_perfil);

export default router_autenticacao;
