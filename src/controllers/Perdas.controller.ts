import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import Controller from "./Controller";
import { Erro, Perda } from "../types";
import { Tabela_Estoque, Tabela_Perda } from "../db/tabelas";
import { Prisma } from "@prisma/client";
import validar_perda from "../utils/validacao/validar_perda";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import definir_query from "../utils/definir_query";
import extrair_paginacao from "../utils/extrair_paginacao";
import ordenar_documentos from "../utils/ordenar_documentos";

export default class Controller_Perdas extends Controller {
  list: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const { nome_item } = req.query;
    const filtros: Prisma.PerdaWhereInput = {};

    if (nome_item) {
      filtros.perda_item = {
        some: {
          item: {
            nome: {
              contains: String(nome_item),
              mode: "insensitive",
            },
          },
        },
      };
    }

    const query = definir_query(
      filtros,
      ordenar_documentos("-data", Tabela_Perda),
      this.selecionar_campos(),
      limite,
      pagina
    );

    try {
      const registros = await Tabela_Perda.count({ where: filtros });

      const maximo_paginas = Math.ceil(registros / limite);

      const perdas = await Tabela_Perda.findMany(query)
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível listar perdas",
          } as Erro;
        });

      res.status(200).send({
        resultado: perdas,
        pagina,
        maximo_paginas,
        limite,
        registros,
      });
    } catch (err) {
      next(err);
    }
  };
  create: RequestHandler = async (req, res, next) => {
    const { itens }: Perda = req.body;

    try {
      validar_perda({ itens });

      const estoques = await Tabela_Estoque.findMany({
        where: {
          item_id: {
            in: itens.map((i) => i.id),
          },
        },
      }).then((res) => {
        const estoques: { [k: number]: number } = {};

        res.map((e) => {
          estoques[e.item_id] = Number(e.quantidade);
        });

        return estoques;
      });

      const erros_estoque: { [k: string]: any } = {};

      for (const item of itens) {
        const { id, quantidade } = item;
        const estoque = estoques[id];

        if (!estoque) {
          erros_estoque[id] = "O estoque deste produto não está disponível";
        } else if (estoque < quantidade) {
          erros_estoque[id] =
            "Não há quantia o suficiente no estoque para realizar a operação";
        }
      }

      if (Object.keys(erros_estoque).length > 0) {
        throw {
          codigo: 400,
          erro: erros_estoque,
          mensagem: "Não foi possível criar perda",
        } as Erro;
      }

      const perdas = await Tabela_Perda.create({
        data: {
          perda_item: {
            create: itens.map((i) => {
              estoques[i.id] -= i.quantidade;
              return {
                item: {
                  connect: {
                    id: i.id,
                  },
                },
                quantidade: i.quantidade,
              };
            }),
          },
        },
        select: this.selecionar_campos(),
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível criar perda",
          } as Erro;
        });

      for (const k in estoques) {
        const estoque = estoques[k];

        await Tabela_Estoque.update({
          where: {
            item_id: Number(k),
          },
          data: {
            quantidade: estoque,
          },
        });
      }

      res.status(201).send(perdas);
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos() {
    const selecionados: Prisma.PerdaSelect = {
      id: true,
      data: true,
      perda_item: {
        orderBy: {
          item_id: "asc",
        },
        select: {
          quantidade: true,
          item: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
    };

    return selecionados;
  }
}
