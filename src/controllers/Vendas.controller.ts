import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import Controller from "./Controller";
import { Erro, Venda } from "../types";
import { Tabela_Venda } from "../db/tabelas";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import validar_venda from "../utils/validacao/validar_venda";

export default class Controller_Vendas extends Controller {
  create: RequestHandler = async (req, res, next) => {
    const { itens, cliente_id }: Venda = req.body;

    try {
      validar_venda({ itens, cliente_id });
      
      const valor_total = itens
        .map((i) => i.quantidade * i.valor_combinado)
        .reduce((prev, curr) => prev + curr);

      const venda = await Tabela_Venda.create({
        data: {
          cliente_id,
          venda_item: {
            create: itens.map((i) => {
              const { item_id, quantidade, valor_combinado } = i;

              return {
                item_id,
                quantidade,
                valor_venda: valor_combinado,
              };
            }),
          },
          valor_total,
        },
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível criar a venda",
          } as Erro;
        });

      res.status(201).send(venda);
    } catch (err) {
      next(err);
    }
  };
}
