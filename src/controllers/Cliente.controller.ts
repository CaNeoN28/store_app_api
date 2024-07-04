import { RequestHandler } from "express";
import Controller from "./Controller";
import { Tabela_Cliente } from "../db/tabelas";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { Cliente, Erro } from "../types";
import validar_cliente from "../utils/validacao/validar_cliente";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Prisma } from "@prisma/client";

export default class Controller_Cliente extends Controller {
  list: RequestHandler = async (req, res, next) => {
    try {
      const clientes = await Tabela_Cliente.findMany({})
        .then((res) => res)
        .catch((err) => {});

      res.status(200).send(clientes);
    } catch (err) {
      next(err);
    }
  };

  create: RequestHandler = async (req, res, next) => {
    const { cnpj, nome }: Cliente = req.body;

    try {
      validar_cliente({ cnpj, nome }, true);

      const cliente = await Tabela_Cliente.create({
        data: {
          cnpj,
          nome,
        },
        select: this.selecionar_campos(),
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível criar o cliente",
          } as Erro;
        });

      res.status(201).send(cliente);
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos() {
    const selecionados: Prisma.ClienteSelect = {
      id: true,
      cnpj: true,
      nome: true,
    };

    return selecionados;
  }
}
