import { RequestHandler } from "express";
import Controller from "./Controller";
import { Tabela_Unidade } from "../db/tabelas";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Erro, Unidade } from "../types";
import definir_query from "../utils/definir_query";
import { Prisma } from "@prisma/client";
import ordenar_documentos from "../utils/ordenar_documentos";
import { validar_id, validar_unidade } from "../utils/validacao";

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
    let limite = Number(req.query.limite),
      pagina = Number(req.query.pagina);

    if (isNaN(limite)) {
      limite = Controller.LIMITE_EXIBICAO_PADRAO;
    }

    if (isNaN(pagina)) {
      pagina = Controller.PAGINA_EXIBICAO_PADRAO;
    }

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

      const maximo_paginas = registros > 0 ? Math.floor(registros / limite) : 0;

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
        resultado: unidades,
        pagina,
        maximo_paginas,
        registros,
        limite,
      });
    } catch (err) {
      next(err);
    }
  };
  update_by_id: RequestHandler = async (req, res, next) => {
    try {
      res.send("Atualizar unidade");
    } catch (err) {}
  };
  remove_by_id: RequestHandler = async (req, res, next) => {
    try {
      res.send("Remover unidade");
    } catch (err) {}
  };

  protected selecionar_campos() {
    const selecionados: Prisma.UnidadeSelect = {
      id: true,
      nome: true,
    };

    return selecionados;
  }
}
