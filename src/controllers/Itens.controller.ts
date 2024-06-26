import { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

export default class Controller_Itens extends Controller {
  constructor() {
    super("item");
  }

  getMany: RequestHandler = async (req, res, next) => {
    const { nome } = req.query;

    const where: Prisma.ItemWhereInput = {};

    if (nome) {
      where.nome = {
        contains: String(nome),
        mode: "insensitive",
      };
    }

    const include: Prisma.ItemInclude<DefaultArgs> = {
      unidade: {
        select: {
          nome: true,
        },
      },
    };

    const itens = await this.find({
      where,
      include,
    });

    res.send(itens);
  };
}
