import { Router } from "express";
import Controller_Itens from "../controllers/Itens.controller";

const router_itens = Router();
const controller = new Controller_Itens();

router_itens.route("/itens").get(controller.list);

export default router_itens