import { Router } from "express";

const router_itens = Router();

router_itens.route("/itens").get((req, res) => {
  res.send("Itens");
});

export default router_itens