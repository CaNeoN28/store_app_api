import { RequestHandler } from "express";
import Controller from "./Controller";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { Compra, Erro } from "../types";
import { validar_id } from "../utils/validacao";
import validar_compra from "../utils/validacao/validar_compra";
import { Tabela_Compra } from "../db/tabelas";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Prisma } from "@prisma/client";
import definir_query from "../utils/definir_query";
import ordenar_documentos from "../utils/ordenar_documentos";

export default class Controller_Compras extends Controller {
  list: RequestHandler = async (req, res, next) => {
    let limite = Number(req.query.limite),
      pagina = Number(req.query.pagina);

    if (isNaN(limite)) limite = Controller.LIMITE_EXIBICAO_PADRAO;
    if (isNaN(pagina)) pagina = Controller.PAGINA_EXIBICAO_PADRAO;

    try {
      const registros = await Tabela_Compra.count();

      const maximo_paginas =
        registros > 0 ? Math.floor(registros / limite) + 1 : 0;

      const query = definir_query(
        {},
        ordenar_documentos("-data", Tabela_Compra),
        this.selecionar_campos(true),
        limite,
        pagina
      );

      const compras = await Tabela_Compra.findMany(query);

      res.status(200).send({
        resultado: compras,
        pagina,
        maximo_paginas,
        registros,
        limite,
      });
    } catch (err) {
      next(err);
    }
  };
  list_fornecedor: RequestHandler = async (req, res, next) => {
    const fornecedor_id = Number(req.params.fornecedor_id);

    let limite = Number(req.query.limite),
      pagina = Number(req.query.pagina);

    if (isNaN(limite)) limite = Controller.LIMITE_EXIBICAO_PADRAO;
    if (isNaN(pagina)) pagina = Controller.PAGINA_EXIBICAO_PADRAO;

    try {
      validar_id(fornecedor_id);

      const registros = await Tabela_Compra.count({ where: { fornecedor_id } });

      const maximo_paginas =
        registros > 0 ? Math.floor(registros / limite) + 1 : 0;

      const query = definir_query(
        { fornecedor_id },
        ordenar_documentos("-data", Tabela_Compra),
        this.selecionar_campos(),
        limite,
        pagina
      );

      const compras = await Tabela_Compra.findMany(query);

      res.status(200).send({
        resultado: compras,
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
    const { fornecedor_id, itens }: Compra = req.body;
    try {
      validar_compra({ fornecedor_id, itens });

      const valor_total =
        itens.length > 0
          ? itens
              .map((item) => {
                const valor = item.quantidade * item.valor_combinado;

                return valor;
              })
              .reduce((prev, curr) => {
                return prev + curr;
              })
          : 0;

      const compra = await Tabela_Compra.create({
        data: {
          valor_total,
          fornecedor_id,
          compra_item: {
            create: itens.map((item) => ({
              item_id: item.item_id,
              quantidade: item.quantidade,
              valor_combinado: item.valor_combinado,
            })),
          },
        },
        select: this.selecionar_campos(true, true),
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível cadastrar a compra",
          } as Erro;
        });

      res.status(201).send(compra);
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos(
    mostrar_fornecedor?: boolean,
    mostrar_itens?: boolean
  ) {
    const selecionados: Prisma.CompraSelect = {
      id: true,
      data: true,
      valor_total: true,
      fornecedor: mostrar_fornecedor
        ? {
            select: {
              id: true,
              cnpj: true,
              nome: true,
            },
          }
        : false,
      compra_item: mostrar_itens
        ? {
            select: {
              quantidade: true,
              valor_combinado: true,
              item: {
                select: {
                  id: true,
                  nome: true,
                  imagem_url: true,
                  unidade: { select: { nome: true } },
                },
              },
            },
          }
        : false,
    };

    return selecionados;
  }
}
