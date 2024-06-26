import { RequestHandler } from "express";
import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

type TABELA = "item";

export default abstract class Controller {
  tabela: TABELA;

  constructor(tabela: TABELA) {
    this.tabela = tabela;
  }

  getMany: RequestHandler = async (req, res, senc) => {
    res.send(this.find());
  };

  find = async (query: Prisma.ItemFindManyArgs<DefaultArgs> = {}) => {
    const pesquisa = prisma[this.tabela].findMany(query);

    const itens = await pesquisa
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.log(err);

        return [];
      });

    return itens;
  };
}
