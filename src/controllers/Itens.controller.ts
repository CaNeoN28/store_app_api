import { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

export default class Controller_Itens extends Controller {
  constructor() {
    super("item");
  }

  getMany: RequestHandler = async (req, res, next) => {
    const itens = await this.find({
      orderBy: {
        id: "desc",
      },
    });

    res.send(itens);
  };
}
