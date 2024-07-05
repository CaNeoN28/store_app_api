import { RequestHandler } from "express";
import Controller from "./Controller";
import { Tabela_Unidade } from "../db/tabelas";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Erro } from "../types";
import definir_query from "../utils/definir_query";
import { Prisma } from "@prisma/client";
import ordenar_documentos from "../utils/ordenar_documentos";

export default class Controller_Unidades extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    try {
      res.send("Recuperar unidade");
    } catch (err) {}
  };
  create: RequestHandler = async (req, res, next) => {
    try {
      res.send("Criar unidade");
    } catch (err) {}
  };
  list: RequestHandler = async (req, res, next) => {
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
      10,
      1
    );

    try {
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
