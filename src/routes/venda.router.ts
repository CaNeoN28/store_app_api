import { Router } from "express";
import Controller_Vendas from "../controllers/Vendas.controller";

const router_vendas = Router();
const controller = new Controller_Vendas();

export default router_vendas;
