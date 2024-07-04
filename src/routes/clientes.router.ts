import { Router } from "express";
import Controller_Cliente from "../controllers/Cliente.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_clientes = Router();
const controller = new Controller_Cliente();

router_clientes
  .route("/clientes")
  .all(authentication_middleware("CLIENTE"))
  .get(controller.list);

router_clientes
  .route("/cliente")
  .all(authentication_middleware("CLIENTE"))
  .post(controller.create);

router_clientes
  .route("/cliente/:id")
  .all(authentication_middleware("CLIENTE"))
  .get(controller.get_id);

export default router_clientes;
