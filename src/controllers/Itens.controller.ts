import { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";

interface Item {
  id?: number;
  nome: string;
  valor_atual?: number;
  desconto_porcentagem?: number;
  validade_desconto?: Date;
  unidade_id: number;
}

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

  create: RequestHandler = async (req, res, next) => {
    const data: Item = req.body;

    const resposta = await this.insert_one(data);

    if (resposta.criado) {
      res.status(201).send(resposta.criado);
    } else if (resposta.erro) {
      res.status(400).send(resposta.erro);
    }
  };
}
