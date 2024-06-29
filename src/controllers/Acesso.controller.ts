import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";

class Controller_Acesso extends Controller {
  protected selecionados: Prisma.AcessoSelect;

  constructor() {
    super("acesso");

    this.selecionados = {};
  }

  list: RequestHandler = async (req, res, next) => {
    const {} = req.query;
    const filtros: Prisma.AcessoWhereInput = {};
  };

  protected validar_dados(data: any, validar_obrigatorios?: boolean) {
    const erros: {
      [k: string]: string;
    } = {};

    return erros;
  }
}

export default Controller_Acesso;
