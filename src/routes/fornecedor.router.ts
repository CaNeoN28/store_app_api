import { Router } from "express";
import Controller_Fornecedor from "../controllers/Fornecedores.controller";
import authentication_middleware from "../middlewares/authentication.middleware";

const router_fornecedor = Router();
const controller = new Controller_Fornecedor();

router_fornecedor
  .route("/fornecedores")
  .get(authentication_middleware("FORNECEDOR"), controller.list);

export default router_fornecedor;
