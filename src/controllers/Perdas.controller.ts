import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import Controller from "./Controller";
import { Perda } from "../types";
import { Tabela_Perda } from "../db/tabelas";
import { Prisma } from "@prisma/client";
import validar_perda from "../utils/validacao/validar_perda";

export default class Controller_Perdas extends Controller {
  create: RequestHandler = async (req, res, next) => {
    const { itens }: Perda = req.body;

    try {
      validar_perda({ itens });
      
      const perdas = await Tabela_Perda.create({
        data: {
          perda_item: {
            create: itens.map((i) => ({
              item: {
                connect: {
                  id: i.id,
                },
              },
              quantidade: i.quantidade,
            })),
          },
        },
        select: this.selecionar_campos(),
      });

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
