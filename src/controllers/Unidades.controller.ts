import { RequestHandler } from "express";
import Controller from "./Controller";
import { Tabela_Unidade } from "../db/tabelas";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Erro, Metodo, Unidade } from "../types";
import definir_query from "../utils/definir_query";
import { Prisma } from "@prisma/client";
import ordenar_documentos from "../utils/ordenar_documentos";
import { validar_id, validar_unidade } from "../utils/validacao";
import { extrair_paginacao } from "../utils/extracao_request";

export default class Controller_Unidades extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      validar_id(id);

      const unidade = await Tabela_Unidade.findFirst({
        where: { id },
        select: this.selecionar_campos(),
      });

      if (!unidade) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhuma unidade",
          mensagem: "Não foi possível recuperar unidade",
        } as Erro;
      }

      res.status(200).send(unidade);
    } catch (err) {
      next(err);
    }
  };
  create: RequestHandler = async (req, res, next) => {
    let { nome }: Unidade = req.body;
    try {
      validar_unidade({ nome }, true);
      nome = nome.toLowerCase();

      const unidade = await Tabela_Unidade.create({
        data: {
          nome,
        },
        select: this.selecionar_campos(),
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível criar unidade",
          } as Erro;
        });

      res.status(201).send(unidade);
    } catch (err) {
      next(err);
    }
  };
  list: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const { nome, ordenar } = req.query;
    const filtros: Prisma.UnidadeWhereInput = {};

    if (nome) {
      filtros.nome = {
        contains: String(nome),
        mode: "insensitive",
      };
    }

    const query = definir_query(
      filtros,
      ordenar_documentos(ordenar, Tabela_Unidade),
      this.selecionar_campos(),
      limite,
      pagina
    );

    try {
      const registros = await Tabela_Unidade.count({ where: filtros });

      const maximo_paginas =
        registros > 0 ? Math.floor(registros / limite) + 1 : 0;

      const unidades = await Tabela_Unidade.findMany(query)
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível listar unidades",
          } as Erro;
        });

      res.status(200).send({
        pagina,
        maximo_paginas,
        registros,
        limite,
        resultado: unidades,
      });
    } catch (err) {
      next(err);
    }
  };
  update_by_id: RequestHandler = async (req, res, next) => {
    const metodo = req.method as Metodo;

    const id = Number(req.params.id);
    let { nome }: Unidade = req.body;

    try {
      validar_id(id);

      const unidade_antiga = await Tabela_Unidade.findFirst({
        where: { id },
      });
      let unidade_nova: any = undefined;

      if (metodo == "PATCH") {
        validar_unidade({ nome });

        if (nome) nome = nome.toLowerCase();

        unidade_nova = await Tabela_Unidade.update({
          where: { id },
          data: { nome },
          select: this.selecionar_campos(),
        })
          .then((res) => res)
          .catch((err) => {
            const { codigo, erro } = verificar_erro_prisma(err);

            throw {
              codigo,
              erro,
              mensagem: "Não foi possível atualizar a unidade",
            } as Erro;
          });
      } else if (metodo == "PUT") {
        validar_unidade({ nome }, true);

        nome = nome.toLowerCase();

        unidade_nova = await Tabela_Unidade.upsert({
          where: { id },
          create: {
            nome,
            id,
          },
          update: {
            nome,
          },
          select: this.selecionar_campos(),
        })
          .then((res) => res)
          .catch((err) => {
            const { codigo, erro } = verificar_erro_prisma(err);

            throw {
              codigo,
              erro,
              mensagem: "Não foi possível salvar a unidade",
            } as Erro;
          });
      }

      res.status(unidade_antiga ? 200 : 201).send(unidade_nova);
    } catch (err) {
      next(err);
    }
  };
  remove_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);

      await Tabela_Unidade.delete({
        where: { id },
      })
        .then()
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível remover a unidade",
          } as Erro;
        });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos() {
    const selecionados: Prisma.UnidadeSelect = {
      id: true,
      nome: true,
    };

    return selecionados;
  }
}
