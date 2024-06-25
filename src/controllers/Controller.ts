import { NextFunction, Request, RequestHandler, Response } from "express";
import prisma from "../db/prisma";

type TABELA = "item";

export default abstract class Controller {
  tabela: TABELA;

  constructor(tabela: TABELA) {
    this.tabela = tabela;
  }

  get: RequestHandler = async (req, res, senc) => {
    res.send(this.findMany());
  };

  findMany = async () => {
    const itens = await prisma[this.tabela]
      .findMany({})
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.log(err);

        return {};
      });

    return itens;
  };
}
