import { RequestHandler } from "express";
import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

type TABELA = "item";

export default abstract class Controller {
  tabela: TABELA;

  get_order_by: string;
  get_default_select: any;
  get_pagina: number;
  get_limite: number;

  constructor(tabela: TABELA) {
    this.tabela = tabela;

    this.get_pagina = 1;
    this.get_limite = 10;
    this.get_order_by = "";
    this.get_default_select = {};

    Object.keys(prisma[this.tabela].fields).map((k) => {
      this.get_default_select[k] = true;
    });
  }

  get_many: RequestHandler = async (req, res, senc) => {
    res.send(this.find_many());
  };

  find_many = async (
    where: Prisma.ItemWhereInput | undefined = undefined,
    select: Prisma.ItemSelect<DefaultArgs> | undefined = undefined,
    pagina: number | undefined = undefined,
    limite: number | undefined = undefined
  ) => {
    const order_by: any = {};
    const campos = prisma[this.tabela].fields;
    const descendente = this.get_order_by.startsWith("-");
    const formatado = this.get_order_by.substring(1);
    if (Object.keys(campos).find((v) => v == formatado)) {
      order_by[formatado] = descendente ? "desc" : "asc";
    }

    select = { ...this.get_default_select, ...select };

    const pesquisa = prisma[this.tabela].findMany({
      where,
      select,
      orderBy: order_by,
      skip: ((pagina || this.get_pagina) - 1) * (limite || this.get_limite),
      take: limite || this.get_limite,
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
