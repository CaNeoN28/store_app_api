import { Router } from "express";
import Estoque_Controller from "../controllers/Estoque.controller";

const router_estoque = Router()
const controller = new Estoque_Controller()

export default router_estoque