import { Router } from "express";
import Controller_Itens from "../controllers/Itens.controller";
import authentication_middleware from "../middlewares/authentication.middleware";
import fileUpload from "express-fileupload";
import Image_Handler from "../middlewares/Image_handlers";

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
    Image_Handler.insert_image("itens"),
    controller.upload_image
  );

router_itens
  .route("/itens/imagens/:caminho")
  .get(Image_Handler.get_image("itens"))
  .delete(authentication_middleware("ITEM"), Image_Handler.remove_image("itens"))

export default router_itens;
