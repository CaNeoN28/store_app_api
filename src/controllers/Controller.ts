import { RequestHandler, response } from "express";
import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

type TABELA = "item";

export default abstract class Controller {
  static ORDENACAO_PADRAO = { id: "asc" };
  static PAGINA_EXIBICAO_PADRAO = 1;
  static LIMITE_EXIBICAO_PADRAO = 10;

  tabela: TABELA;

  protected filtros: Prisma.ItemWhereInput;
  protected selecionados: any;
  protected ordenacao: any;
  protected pagina_exibicao: number;
  protected limite_exibicao: number;

  constructor(tabela: TABELA) {
    this.tabela = tabela;

    const campos = Object.keys(prisma[tabela].fields);

    this.filtros = {};
    this.selecionados = {};
    this.ordenacao = Controller.ORDENACAO_PADRAO;
    this.pagina_exibicao = Controller.PAGINA_EXIBICAO_PADRAO;
    this.limite_exibicao = Controller.LIMITE_EXIBICAO_PADRAO;

    campos.map((c) => {
      this.selecionados[c] = true;
    });
  }

  //Métodos referentes às requests
  get_id: RequestHandler = async (req, res, next) => {
    const { id } = req.params;
    const number_id = Number(id);

    if (!isNaN(number_id)) {
      this.filtros = {
        id: number_id,
      };
      const item = await this.find_one();

      if (item) {
        return res.send(item);
      }

      return res.status(404).send(`${this.tabela} não encontrado(a)`);
    }

    res.status(400).send("id inválido");
  };

  protected find_one = async () => {
    const item = await prisma[this.tabela]
      .findFirst({
        where: this.filtros,
        select: this.selecionados,
      })
      .then((res) => res)
      .catch((err) => {
        console.log(err);

        return undefined;
      });

    return item;
  };

  list: RequestHandler = async (req, res, next) => {
    res.send(this.find_many());
  };

  protected find_many = async () => {
    const itens = await prisma[this.tabela]
      .findMany({
        where: this.filtros,
        orderBy: this.ordenacao,
        select: this.selecionados,
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

  create: RequestHandler = async (req, res, next) => {
    const data = req.body;

    const resposta = await this.insert_one(data);

    res.send(resposta);
  };

  protected insert_one = async (data: any) => {
    const resposta = await prisma[this.tabela]
      .create({
        data,
        select: this.selecionados,
      })
      .then((res) => ({
        criado: res,
      }))
      .catch((err) => ({
        erro: err,
      }));

    return resposta;
  };

  //Métodos set da classe
  set_filtros(filtros: Prisma.ItemWhereInput) {
    this.filtros = filtros;
  }

  set_selecionados(selecionados: Prisma.ItemSelect<DefaultArgs>) {
    this.selecionados = {
      ...Controller.selecionar_todos_os_campos(this.tabela),
      ...selecionados,
    };
  }

  set_ordenacao(campo: any) {
    const formatado = String(campo).replace("-", "");
    const descendente = String(campo).startsWith("-");
    const campos = Object.keys(prisma[this.tabela].fields);

    if (campos.find((c) => c == formatado)) {
      this.ordenacao = {
        [formatado]: descendente ? "desc" : "asc",
      };
    } else {
      this.ordenacao = Controller.ORDENACAO_PADRAO;
    }
  }

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

  static selecionar_todos_os_campos(tabela: TABELA) {
    const campos = Object.keys(prisma[tabela].fields);
    const selecionados: any = {};

    campos.map((c) => {
      selecionados[c] = true;
    });

    return selecionados;
  }
}
