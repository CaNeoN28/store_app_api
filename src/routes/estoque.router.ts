import { Router } from "express";
import Estoque_Controller from "../controllers/Estoque.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_estoque = Router();
const controller = new Estoque_Controller();

router_estoque
  .route("/itens/estoque")
  .get(authentication_middleware("ESTOQUE"), controller.list);

export default router_estoque;
