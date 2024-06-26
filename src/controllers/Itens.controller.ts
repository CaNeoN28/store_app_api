import { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";

export default class Controller_Itens extends Controller {
  constructor() {
    super("item");
  }

  get_many: RequestHandler = async (req, res, next) => {
    const { nome, em_desconto, ordenar } = req.query;

    const where: Prisma.ItemWhereInput = {};

    if (nome) {
      where.nome = {
        contains: String(nome),
        mode: "insensitive",
      };
    }

    if (em_desconto && em_desconto == "SIM") {
      where.desconto_porcentagem = {
        not: 0.0,
      };

      where.validade_desconto = {
        gt: new Date(),
      };
    }

    const include: Prisma.ItemInclude<DefaultArgs> = {
      unidade: {
        select: {
          nome: true,
        },
      },
    };

    this.get_order_by = String(ordenar);

    const itens = await this.find({
      where,
      include,
    });

    res.send(itens);
  };
}
