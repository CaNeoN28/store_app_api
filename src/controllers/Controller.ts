import { RequestHandler } from "express";
import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

type TABELA = "item";

export default abstract class Controller {
  tabela: TABELA;

  get_order_by: string;

  constructor(tabela: TABELA) {
    this.tabela = tabela;

    this.get_order_by = "";
  }

  get_many: RequestHandler = async (req, res, senc) => {
    res.send(this.find());
  };

  find = async (query: Prisma.ItemFindManyArgs<DefaultArgs> = {}) => {
    const order_by: any = {};

    const campos = prisma[this.tabela].fields;

    const descendente = this.get_order_by.startsWith("-");
    const formatado = this.get_order_by.substring(1);

    if (Object.keys(campos).find((v) => v == formatado)) {
      order_by[formatado] = descendente ? "desc" : "asc";
    }

    const pesquisa = prisma[this.tabela].findMany({
      ...query,
      orderBy: order_by,
    });

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
