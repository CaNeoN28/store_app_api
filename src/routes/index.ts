import { Router } from "express";
import items_router from "./items.router";

function config_router() {
  const router = Router();

  router.get("/", (req, res) => {
    res.status(200).send("Hello world");
  });

  router.use(items_router)

  return router;
}

export default config_router;
