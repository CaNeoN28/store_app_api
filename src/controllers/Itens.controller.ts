import { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

export default class Controller_Itens extends Controller {
  constructor() {
    super("item");
  }

  list: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = req.query;

    this.set_limite(limite);

    res.send(await this.find_many());
  };
}
