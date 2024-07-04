import { RequestHandler } from "express";
import Controller from "./Controller";
import { Tabela_Cliente } from "../db/tabelas";
import { Cliente, Erro } from "../types";
import validar_cliente from "../utils/validacao/validar_cliente";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Prisma } from "@prisma/client";
import definir_query from "../utils/definir_query";
import ordenar_documentos from "../utils/ordenar_documentos";

export default class Controller_Cliente extends Controller {
  list: RequestHandler = async (req, res, next) => {
    let limite = Number(req.query.limite),
      pagina = Number(req.query.pagina);

    if (isNaN(limite)) {
      limite = Controller.LIMITE_EXIBICAO_PADRAO;
    }

    if (isNaN(pagina)) {
      pagina = Controller.PAGINA_EXIBICAO_PADRAO;
    }

    const { nome, cnpj, ordenar } = req.query;
    const filtros: Prisma.ClienteWhereInput = {};

    if (nome) {
      filtros.nome = {
        contains: String(nome),
        mode: "insensitive",
      };
    }

    if (cnpj) {
      filtros.cnpj = String(cnpj);
    }

    const query = definir_query(
      filtros,
      ordenar_documentos(ordenar, Tabela_Cliente),
      this.selecionar_campos(),
      limite,
      pagina
    );

    try {
      const registros = await Tabela_Cliente.count({ where: filtros });

      const maximo_paginas = registros > 0 ? Math.floor(registros / limite) : 0;

      const clientes = await Tabela_Cliente.findMany(query)
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível listar os clientes",
          } as Erro;
        });

      res.status(200).send({
        resultado: clientes,
        pagina,
        maximo_paginas,
        registros,
        limite,
      });
    } catch (err) {
      next(err);
    }
  };

  create: RequestHandler = async (req, res, next) => {
    const { cnpj, nome }: Cliente = req.body;

    try {
      validar_cliente({ cnpj, nome }, true);

      const cliente = await Tabela_Cliente.create({
        data: {
          cnpj,
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
            mensagem: "Não foi possível criar o cliente",
          } as Erro;
        });

      res.status(201).send(cliente);
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos() {
    const selecionados: Prisma.ClienteSelect = {
      id: true,
      cnpj: true,
      nome: true,
    };

    return selecionados;
  }
}
