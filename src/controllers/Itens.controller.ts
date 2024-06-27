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
    const { nome, unidade_id, desconto_porcentagem, id, valor_atual }: Item =
      req.body;

    const validade_desconto: Date | undefined = req.body.validade_desconto
      ? new Date(req.body.validade_desconto)
      : undefined;

    const erros = this.validar_dados(
      {
        nome,
        unidade_id,
        desconto_porcentagem,
        id,
        valor_atual,
      },
      true
    );

    if (erros) {
      return res.status(400).send({
        mensagem: "Erro de validação de item",
        erros,
      });
    }

    const resposta = await this.insert_one({
      nome,
      unidade_id,
      desconto_porcentagem,
      id,
      validade_desconto,
      valor_atual,
    });

    if (resposta.criado) {
      res.status(201).send(resposta.criado);
    } else if (resposta.erro) {
      res.status(400).send(resposta.erro);
    }
  };

  validar_dados = (
    {
      nome,
      unidade_id,
      desconto_porcentagem,
      id,
      validade_desconto,
      valor_atual,
    }: Item,
    validar_obrigatorios?: boolean
  ) => {
    const erros: {
      [k: string]: string;
    } = {};

    if (validar_obrigatorios && !nome) {
      erros.nome = "O nome do item é obrigatório";
    }

    if (validar_obrigatorios && !unidade_id) {
      erros.unidade_id = "O id da unidade do item é obrigatório";
    } else if (isNaN(Number(unidade_id))) {
      erros.unidade_id = "O id da unidade deve ser um número";
    }

    if (desconto_porcentagem) {
      if (isNaN(desconto_porcentagem)) {
        erros.desconto_porcentagem = "O desconto deve ser um número";
      } else if (desconto_porcentagem < 0) {
        erros.desconto_porcentagem = "O desconto deve ser maior que zero";
      } else if (desconto_porcentagem > 100) {
        erros.desconto_porcentagem = "O desconto não deve ser maior que 100%";
      }
    }

    if (id) {
      if (isNaN(id)) {
        erros.id = "O id deve ser um número";
      } else if (id < 0) {
        erros.id = "O id deve ser maior que zero";
      }
    }

    if (validade_desconto) {
      if (isNaN(Number(validade_desconto))) {
        erros.validade_desconto =
          "A validade do desconto deve ser uma data válida";
      }
    }

    if (valor_atual) {
      if (isNaN(valor_atual)) {
        erros.valor_atual = "O valor atual deve ser um número";
      } else if (valor_atual < 0) {
        erros.valor_atual = "O valor atual deve ser maior que zero";
      }
    }

    if (Object.keys(erros).length > 0) {
      return erros;
    }

    return undefined;
  };
}
