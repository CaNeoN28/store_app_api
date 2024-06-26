import { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";

export default class Controller_Itens extends Controller {
  constructor() {
    super("item");
  }

  list: RequestHandler = async (req, res, next) => {
    const { nome, em_desconto, limite, pagina } = req.query;
    const filtros: Prisma.ItemWhereInput = {};

    if (nome) {
      filtros.nome = {
        contains: String(nome),
        mode: "insensitive",
      };
    }

    if (em_desconto && String(em_desconto) == "SIM") {
      filtros.desconto_porcentagem = {
        not: 0.0,
      };

      filtros.validade_desconto = {
        gt: new Date(),
      };
    }

    this.set_filtros(filtros);
    this.set_limite(limite);
    this.set_pagina(pagina);

    res.send(await this.find_many());
  };
}
