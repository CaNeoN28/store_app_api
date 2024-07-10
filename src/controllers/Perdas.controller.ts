import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import Controller from "./Controller";
import { Perda } from "../types";
import { Tabela_Perda } from "../db/tabelas";

export default class Controller_Perdas extends Controller {
  create: RequestHandler = async (req, res, next) => {
    const { itens }: Perda = req.body;

    try {
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
      });

      res.status(201).send(perdas);
    } catch (err) {
      next(err);
    }
  };
}
