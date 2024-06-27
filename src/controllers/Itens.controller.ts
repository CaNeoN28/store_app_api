import { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";

export default class Controller_Itens extends Controller {
  constructor() {
    super("item");

    const selecionados = {
      unidade_id: false,
      unidade: {
        select: {
          id: true,
          nome: true,
        },
      },
    };

    this.set_selecionados(selecionados);
  }

  list: RequestHandler = async (req, res, next) => {
    const { nome, em_desconto, ordenar, limite, pagina } = req.query;
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
    this.set_ordenacao(ordenar);
    this.set_limite(limite);
    this.set_pagina(pagina);

    const resposta = await this.find_many();

    res.send(resposta);
  };
}
