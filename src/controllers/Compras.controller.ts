import { RequestHandler } from "express";
import Controller from "./Controller";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { Compra } from "../types";
import { validar_id } from "../utils/validacao";
import validar_compra from "../utils/validacao/validar_compra";
import { Tabela_Compra } from "../db/tabelas";

export default class Controller_Compras extends Controller {
  list: RequestHandler = async (req, res, next) => {};
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
        select: {
          data: true,
          valor_total: true,
          fornecedor: {
            select: {
              id: true,
              cnpj: true,
              nome: true,
            },
          },
          compra_item: {
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
          },
        },
      });

      res.status(201).send(compra);
    } catch (err) {
      next(err);
    }
  };
}
