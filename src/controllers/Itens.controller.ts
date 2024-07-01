import e, { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { Erro } from "../types/resposta";
import verificar_codigo_prisma from "../utils/verificar_codigo_prisma";
import { DefaultArgs } from "@prisma/client/runtime/library";
import { Item } from "../types";

export default class Controller_Itens extends Controller {
  tabela: Prisma.ItemDelegate<DefaultArgs>;

  protected selecionados: Prisma.ItemSelect;

  constructor() {
    super("item");

    this.tabela = Controller.delegar_tabela(
      "item"
    ) as Prisma.ItemDelegate<DefaultArgs>;

    this.selecionados = {};
    this.selecionar_todos_os_campos();
    this.selecionados.unidade = {
      select: {
        id: true,
        nome: true,
      },
    };
    this.selecionados.unidade_id = false;
  }

  get_id: RequestHandler = async (req, res, next) => {
    const { id } = req.params;
    const number_id = Number(id);

    try {
      Controller.validar_id(number_id);
      const item = await this.find_one({
        id: number_id,
      });

      res.status(200).send(item);
    } catch (err) {
      next(err);
    }
  };
  protected find_one = async (filtros: Prisma.ItemWhereInput) => {
    const item = await this.tabela
      .findFirst({
        where: filtros,
        select: this.selecionados,
      })
      .then((res) => res)
      .catch(() => undefined);

    if (!item) {
      throw {
        codigo: 404,
        erro: "O id informado não corresponde a nenhum item",
        mensagem: "Não foi possível recuperar o item",
      } as Erro;
    }

    return item;
  };

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

    const ordenacao = this.formatar_ordenacao(
      ordenar
    ) as Prisma.ItemOrderByWithRelationInput;

    try {
      const resposta = await this.find_many(
        filtros,
        ordenacao,
        Number(limite),
        Number(pagina)
      );

      res.send(resposta);
    } catch (err) {
      next(err);
    }
  };
  protected find_many = async (
    filtros: Prisma.ItemWhereInput,
    ordenacao: Prisma.ItemOrderByWithRelationInput,
    limite: number,
    pagina: number
  ) => {
    const query = Controller.definir_query(
      filtros,
      ordenacao,
      this.selecionados,
      limite,
      pagina
    );

    const registros =
      (await this.tabela.count({
        where: filtros,
      })) | 0;
    const resultado = await this.tabela.findMany(query);

    const maximo_paginas =
      registros > 0 ? 1 + Math.floor(registros / limite) : 0;

    return {
      resultado,
      pagina,
      maximo_paginas,
      registros,
      limite,
    };
  };

  create: RequestHandler = async (req, res, next) => {
    const { nome, unidade_id, desconto_porcentagem, valor_atual }: Item =
      req.body;

    const validade_desconto: Date | undefined = req.body.validade_desconto
      ? new Date(req.body.validade_desconto)
      : undefined;

    try {
      const item = await this.insert_one({
        nome,
        unidade_id,
        desconto_porcentagem,
        validade_desconto,
        valor_atual,
      });

      res.status(201).send(item);
    } catch (err) {
      next(err);
    }
  };
  protected insert_one = async (data: Item) => {
    this.validar_dados(data, true);

    const item = await this.tabela
      .create({
        data,
        select: this.selecionados,
      })
      .then((res) => res)
      .catch((err) => {
        throw err;
      });

    return item;
  };

  update_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);
    const metodo = req.method as "PATCH" | "PUT";
    const {
      nome,
      unidade_id,
      desconto_porcentagem,
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
      valor_atual,
    };

    try {
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
      }
    } catch (err) {
      next(err);
    }
  };
  protected update_one = async (id: number, data: any): Promise<any> => {
    Controller.validar_id(id);
    this.validar_dados(data);

    const item = await this.tabela
      .update({
        where: { id },
        data,
      })
      .then((res) => res)
      .catch((err) => {
        const { codigo, erro } = verificar_codigo_prisma(err);

        throw {
          mensagem: "Não foi possível salvar o item",
          codigo,
          erro,
        } as Erro;
      });

    return item;
  };
  protected upsert_one = async (id: number, data: any): Promise<any> => {
    Controller.validar_id(id);
    this.validar_dados(data, true);

    const item = await this.tabela
      .upsert({
        where: { id },
        create: data,
        update: data,
      })
      .then((res) => res)
      .catch((err) => {
        const { codigo, erro } = verificar_codigo_prisma(err);

        throw {
          mensagem: "Não foi possível salvar o item",
          codigo,
          erro,
        } as Erro;
      });

    return item;
  };

  remove_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      await this.delete_one(id);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
  protected delete_one = async (id: number): Promise<any> => {
    Controller.validar_id(id);
    await this.tabela
      .delete({
        where: { id },
      })
      .then()
      .catch((err) => {
        const { codigo, erro } = verificar_codigo_prisma(err);

        throw {
          mensagem: "Não foi possível remover o item",
          codigo,
          erro,
        } as Erro;
      });
  };

  protected validar_dados = (
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
      throw {
        codigo: 400,
        erro: erros,
        mensagem: "Erro de validação de item",
      } as Erro;
    }
  };
}
