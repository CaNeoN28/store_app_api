import e, { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import Resposta from "../types/resposta";
import verificar_codigo_prisma from "../utils/verificar_codigo_prisma";
import { DefaultArgs } from "@prisma/client/runtime/library";

interface Item {
  id?: number;
  nome: string;
  valor_atual?: number;
  desconto_porcentagem?: number;
  validade_desconto?: Date;
  unidade_id: number;
}

export default class Controller_Itens extends Controller {
  tabela: Prisma.ItemDelegate<DefaultArgs>;

  protected selecionados: Prisma.ItemSelect;

  constructor() {
    super("item");

    this.tabela = Controller.delegar_tabela(
      "item"
    ) as Prisma.ItemDelegate<DefaultArgs>;

    this.selecionados = {
      id: true,
      nome: true,
      valor_atual: true,
      desconto_porcentagem: true,
      validade_desconto: true,
      unidade: {
        select: {
          id: true,
          nome: true,
        },
      },
    };
  }

  get_id: RequestHandler = async (req, res, next) => {
    const { id } = req.params;
    const number_id = Number(id);

    const resposta: Resposta = {};

    if (isNaN(number_id)) {
      resposta.erro = {
        codigo: 400,
        erro: "O id informado é inválido",
        mensagem: "Não foi possível recuperar o item",
      };
    } else {
      const item = await this.find_one({
        id: number_id,
      });

      if (item) resposta.dados = item;
      else {
        resposta.erro = {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum item",
          mensagem: "Não foi possível recuperar o item",
        };
      }
    }

    if (resposta.erro) {
      const { codigo, erro, mensagem } = resposta.erro;

      return res.status(codigo).send({
        mensagem,
        erro,
      });
    }

    res.status(200).send(resposta.dados);
  };
  protected find_one = async (filtros: Prisma.ItemWhereInput) => {
    const item = await this.tabela
      .findFirst({
        where: filtros,
        select: this.selecionados,
      })
      .then((res) => res)
      .catch((err) => undefined);

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

    const resposta = await this.find_many(
      filtros,
      ordenacao,
      Number(limite),
      Number(pagina)
    );

    res.send(resposta);
  };
  protected find_many = async (
    filtros: Prisma.ItemWhereInput,
    ordenacao: Prisma.ItemOrderByWithRelationInput,
    limite: number,
    pagina: number
  ) => {
    if (isNaN(limite)) limite = Controller.LIMITE_EXIBICAO_PADRAO;
    if (isNaN(pagina)) pagina = Controller.PAGINA_EXIBICAO_PADRAO;

    const registros =
      (await this.tabela.count({
        where: filtros,
      })) | 0;
    const resultado = await this.tabela.findMany({
      where: filtros,
      orderBy: ordenacao,
      select: this.selecionados,
      skip: (pagina - 1) * limite,
      take: limite,
    });

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

    if (resposta.erro) {
      const { codigo, erro, mensagem } = resposta.erro;
      return res.status(codigo).send({
        mensagem,
        erro,
      });
    }

    res.status(200).send(resposta.dados);
  };
  protected insert_one = async (data: Item) => {
    const erros = this.validar_dados(data, true);
    const resposta: Resposta = {};

    if (erros) {
      resposta.erro = {
        codigo: 400,
        mensagem: "Erro de validação de item",
        erro: erros,
      };
    } else {
      await this.tabela
        .create({
          data,
          select: this.selecionados,
        })
        .then((res) => {
          resposta.dados = res;
        })
        .catch((err) => {
          const { codigo, erro } = verificar_codigo_prisma(err);

          resposta.erro = {
            mensagem: "Não foi possível salvar o item",
            codigo,
            erro,
          };
        });
    }

    return resposta;
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
  protected update_one = async (id: number, data: any): Promise<any> => {
    const resposta: Resposta = {};

    if (isNaN(id)) {
      resposta.erro = {
        mensagem: "Não foi possível atualizar o item",
        codigo: 400,
        erro: "O id informado é inválido",
      };
    } else {
      const erros = this.validar_dados(data);

      if (!erros) {
        await this.tabela
          .update({
            where: { id },
            data,
          })
          .then((res) => {
            resposta.dados = res;
          })
          .catch((err) => {
            const { codigo, erro } = verificar_codigo_prisma(err);

            resposta.erro = {
              mensagem: "Não foi possível salvar o item",
              codigo,
              erro,
            };
          });
      } else {
        resposta.erro = {
          mensagem: "Não foi possível salvar o item",
          codigo: 400,
          erro: erros,
        };
      }
    }

    return resposta;
  };
  protected upsert_one = async (id: number, data: any): Promise<any> => {
    const resposta: Resposta = {};

    if (isNaN(id)) {
      resposta.erro = {
        mensagem: "Não foi possível atualizar o item",
        codigo: 400,
        erro: "O id informado é inválido",
      };
    } else {
      const erros = this.validar_dados(data, true);

      if (!erros) {
        await this.tabela
          .upsert({
            where: { id },
            create: data,
            update: data,
          })
          .then((res) => {
            resposta.dados = res;
          })
          .catch((err) => {
            const { codigo, erro } = verificar_codigo_prisma(err);

            resposta.erro = {
              mensagem: "Não foi possível salvar o item",
              codigo,
              erro,
            };
          });
      } else {
        resposta.erro = {
          mensagem: "Não foi possível salvar o item",
          codigo: 400,
          erro: erros,
        };
      }
    }

    return resposta;
  };

  remove_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    const resposta = await this.delete_one(id);

    if (resposta.erro) {
      const { codigo, erro, mensagem } = resposta.erro;

      return res.status(codigo).send({
        mensagem,
        erro,
      });
    }

    res.status(204).send();
  };
  protected delete_one = async (id: number): Promise<any> => {
    const resposta: Resposta = {};

    if (isNaN(id)) {
      resposta.erro = {
        codigo: 400,
        erro: "Id inválido",
        mensagem: "Não foi possível remover o item",
      };
    } else {
      await this.tabela
        .delete({
          where: { id },
        })
        .then()
        .catch((err) => {
          const { codigo, erro } = verificar_codigo_prisma(err);

          resposta.erro = {
            mensagem: "Não foi possível removero item",
            codigo,
            erro,
          };
        });
    }

    return resposta;
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
      return erros;
    }

    return undefined;
  };
}
