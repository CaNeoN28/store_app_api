import { Prisma } from "@prisma/client";
import Controller from "./Controller";
import { RequestHandler } from "express";
import { Tabela_Estoque, Tabela_Item } from "../db/tabelas";
import extrair_paginacao from "../utils/extrair_paginacao";
import { Estoque, Metodo } from "../types";
import { METODOS } from "../utils/globals";
import { validar_estoque, validar_id } from "../utils/validacao";

export default class Estoque_Controller extends Controller {
  update_by_id: RequestHandler = async (req, res, next) => {
    const { id: usuario_id } = req.user!;

    const item_id = Number(req.params.id);
    const metodo = req.method as Metodo;

    const { quantidade: quantidade_nova }: Estoque = req.body;

    try {
      validar_id(item_id);

      const estoque_antigo = await Tabela_Estoque.findFirst({
        where: {
          item_id,
        },
        select: {
          quantidade: true,
        },
      });
      let estoque_novo: any = undefined;

      if (metodo == "PATCH") {
        validar_estoque({ quantidade: quantidade_nova });

        estoque_novo = await Tabela_Item.update({
          where: {
            id: item_id,
          },
          select: this.selecionar_campos(),
          data: {
            estoque: {
              update: {
                quantidade: quantidade_nova,
                alteracoes_estoque: {
                  create: {
                    usuario_id: usuario_id,
                    quantidade_anterior: estoque_antigo?.quantidade,
                    quantidade_atual:
                      quantidade_nova || estoque_antigo?.quantidade || 0,
                  },
                },
              },
            },
          },
        });
      } else if (metodo == "PUT") {
      }

      res.status(estoque_antigo ? 200 : 201).send(estoque_novo);
    } catch (err) {
      next(err);
    }
  };
  list: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);
    const { nome_item } = req.query;

    const filtros: Prisma.ItemWhereInput = {};

    if (nome_item) {
      filtros.nome = {
        contains: String(nome_item),
        mode: "insensitive",
      };
    }

    try {
      const registros = await Tabela_Item.count({
        where: filtros,
      });

      const maximo_paginas = Math.ceil(registros / limite);

      const estoque = await Tabela_Item.findMany({
        where: filtros,
        select: this.selecionar_campos(),
        skip: (pagina - 1) * limite,
        take: limite,
      }).then((res) => {
        return res.map((item) => {
          const { estoque, nome, id } = item;

          const quantidade = estoque ? estoque.quantidade.toFixed(2) : null;

          return {
            id,
            nome,
            quantidade,
          };
        });
      });

      res.status(200).send({
        resultado: estoque,
        pagina,
        maximo_paginas,
        limite,
        registros,
      });
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos() {
    const selecionados: Prisma.ItemSelect = {
      nome: true,
      id: true,
      estoque: {
        select: {
          quantidade: true,
          alteracoes_estoque: {
            orderBy:{
              data: "desc"
            },
            select: {
              data: true,
              quantidade_anterior: true,
              quantidade_atual: true,
              usuario: {
                select: {
                  id: true,
                  nome_usuario: true,
                  email: true,
                  numero_telefone: true,
                },
              },
            },
          },
        },
      },
    };

    return selecionados;
  }
}
