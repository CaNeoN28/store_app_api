import { Prisma } from "@prisma/client";
import Controller from "./Controller";
import { RequestHandler } from "express";
import { Tabela_Item } from "../db/tabelas";

export default class Estoque_Controller extends Controller {
  list: RequestHandler = async (req, res, next) => {
    try {
      const estoque = await Tabela_Item.findMany({
        select: this.selecionar_campos(),
        orderBy: {
          id: "asc",
        },
      }).then((res) => {
        return res.map((item) => {
          const { nome, estoque, id } = item;
          const quantidade = estoque ? estoque.quantidade.toFixed(2) : "0.00";

          return {
            id,
            nome,
            quantidade,
          };
        });
      });

      res.status(200).send(estoque);
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
