import { Router } from "express";
import Controller_Usuarios from "../controllers/Usuarios.controller";

const router_usuarios = Router();
const controller = new Controller_Usuarios();

router_usuarios.route("/usuarios").get(controller.list);

export default router_usuarios;
