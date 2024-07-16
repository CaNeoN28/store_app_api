import { Router } from "express";
import Controller_Itens from "../controllers/Itens.controller";
import authentication_middleware from "../middlewares/authentication.middleware";
import image_handler from "../middlewares/image_handler.middleware";
import fileUpload from "express-fileupload";
import { Erro } from "../types";
import path from "path";
import fs from "fs";

const router_itens = Router();
const controller = new Controller_Itens();

router_itens.route("/itens").get(controller.list);

router_itens
  .route("/item")
  .post(authentication_middleware("ITEM"), controller.create);

router_itens
  .route("/item/:id")
  .get(controller.get_id)
  .put(authentication_middleware("ITEM"), controller.update_by_id)
  .patch(authentication_middleware("ITEM"), controller.update_by_id)
  .delete(authentication_middleware("ITEM"), controller.remove_by_id);

router_itens
  .route("/item/:id/imagem")
  .all(
    fileUpload({
      useTempFiles: true,
      tempFileDir: "/tmp/",
    })
  )
  .post(
    authentication_middleware("ITEM"),
    image_handler("item"),
    controller.upload_image
  );

router_itens.route("/imagem-item/:caminho").get(async (req, res, next) => {
  const caminho_item = req.params.caminho;

  try {
    if (!caminho_item) {
      throw {
        codigo: 400,
        erro: "É necessário informar o caminho do arquivo",
        mensagem: "Não foi possível recuperar a imagem",
      } as Erro;
    }

    const caminho_relativo = path.resolve("./files/item/");

    const caminho_completo = path.join(caminho_relativo, caminho_item);

    res.sendFile(caminho_completo, (err) => {
      console.log(err);
    });
  } catch (err) {
    next(err);
  }
});

export default router_itens;
