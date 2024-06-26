import { RequestHandler } from "express";
import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

type TABELA = "item";

export default abstract class Controller {
  static PAGINA_EXIBICAO_PADRAO = 1;
  static LIMITE_EXIBICAO_PADRAO = 10;

  tabela: TABELA;

  protected pagina_exibicao: number;
  protected limite_exibicao: number;

  constructor(tabela: TABELA) {
    this.tabela = tabela;

    this.pagina_exibicao = Controller.PAGINA_EXIBICAO_PADRAO;
    this.limite_exibicao = Controller.LIMITE_EXIBICAO_PADRAO;
  }

  list: RequestHandler = async (req, res, senc) => {
    res.send(this.find_many());
  };

  find_many = async () => {
    const itens = await prisma[this.tabela]
      .findMany({
        skip: (this.pagina_exibicao - 1) * this.limite_exibicao,
        take: this.limite_exibicao,
      })
      .then((res) => res)
      .catch((err) => {
        console.log(err);

        return [];
      });

    return {
      resultado: itens,
      pagina: this.pagina_exibicao,
      limite: this.limite_exibicao,
    };
  };

  set_limite(limite: any) {
    const numero = Number(limite);

    if (isNaN(numero)) {
      this.limite_exibicao = Controller.LIMITE_EXIBICAO_PADRAO;
    } else {
      this.limite_exibicao = numero;
    }
  }

  set_pagina(pagina: any) {
    const numero = Number(pagina);

    if (isNaN(numero)) {
      this.pagina_exibicao = Controller.PAGINA_EXIBICAO_PADRAO;
    } else {
      this.pagina_exibicao = numero;
    }
  }
}
