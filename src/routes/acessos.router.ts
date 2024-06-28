import { Router } from "express";
import Controller_Acesso from "../controllers/Acesso.controller";

const router_acessos = Router();
const controller = new Controller_Acesso();

router_acessos.route("/acessos").get(controller.list);

export default router_acessos;
