import { Router } from "express";
import Controller_Compras from "../controllers/Compras.controller";

const router_compras = Router();
const controller = new Controller_Compras();

router_compras.route("/realizar-compra").post(controller.create);

export default router_compras;
