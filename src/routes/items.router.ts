import { Router } from "express";

const items_router = Router();

items_router.route("/items").get((req, res) => {
  res.send("Itens");
});

export default items_router