import { Router } from "express";
import Controller_Autenticacao from "../controllers/Autenticacao.controller";

const router_autenticacao = Router();
const controller = new Controller_Autenticacao();

router_autenticacao.route("/login").post(controller.realizar_login);

export default router_autenticacao;
