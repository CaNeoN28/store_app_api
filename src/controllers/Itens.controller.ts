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
      const { mensagem, codigo, erro } = resposta.erro;
      res.status(codigo).send({
        mensagem,
        erro,
      });
    }
  };

  update_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);
    const metodo = req.method as "PATCH" | "PUT";
    const {
      nome,
      unidade_id,
      desconto_porcentagem,
      id: new_id,
      valor_atual,
    }: Item = req.body;

    const validade_desconto: Date | undefined = req.body.validade_desconto
      ? new Date(req.body.validade_desconto)
      : undefined;

    const data = {
      nome,
      unidade_id,
      desconto_porcentagem,
      validade_desconto,
      id: new_id,
      valor_atual,
    };

    const resposta =
      metodo == "PATCH"
        ? await this.update_one(id, data)
        : metodo == "PUT" && (await this.upsert_one(id, data));

    if (resposta) {
      if (resposta.dados) {
        res.status(200).send(resposta.dados);
      } else if (resposta.erro) {
        const { codigo, erro, mensagem } = resposta.erro;

        res.status(codigo).send({
          mensagem,
          erro,
        });
      }
    } else {
      res.status(500).send("Não foi possível realizar a operação");
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

    if (!nome) {
      if (validar_obrigatorios) erros.nome = "O nome do item é obrigatório";
    }

    if (!unidade_id) {
      if (validar_obrigatorios)
        erros.unidade_id = "O id da unidade do item é obrigatório";
    } else if (isNaN(unidade_id)) {
      erros.unidade_id = "O id da unidade deve ser um número";
    } else if (unidade_id < 0) {
      erros.unidade_id = "O id da unidade deve ser positivo";
    }

    if (desconto_porcentagem) {
      if (isNaN(desconto_porcentagem)) {
        erros.desconto_porcentagem = "O desconto deve ser um número";
      } else if (desconto_porcentagem < 0) {
        erros.desconto_porcentagem = "O desconto deve ser positivo";
      } else if (desconto_porcentagem > 100) {
        erros.desconto_porcentagem = "O desconto não deve ser maior que 100%";
      }
    }

    if (id) {
      if (isNaN(id)) {
        erros.id = "O id deve ser um número";
      } else if (id < 0) {
        erros.id = "O id deve ser positivo";
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
