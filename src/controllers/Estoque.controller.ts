import { Prisma } from "@prisma/client";
import Controller from "./Controller";
import { RequestHandler } from "express";
import { Tabela_Item } from "../db/tabelas";
import extrair_paginacao from "../utils/extrair_paginacao";

export default class Estoque_Controller extends Controller {
  list: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const filtros: Prisma.ItemWhereInput = {};

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
        },
      },
    };

    return selecionados;
  }
}
