import { RequestHandler } from "express-serve-static-core";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";

interface Grupo {
  id?: number;
  nome?: string;
}

export default class Controller_Grupos extends Controller {
  protected selecionados: Prisma.GrupoSelect;
  constructor() {
    super("grupo");

    this.selecionados = {};
  }

  list: RequestHandler = async (req, res, next) => {
    const { nome, ordenar, limite, pagina } = req.query;
    const filtros: Prisma.GrupoWhereInput = {};

    if (nome) {
      filtros.nome = {
        contains: String(nome),
        mode: "insensitive",
      };
    }
  };

  protected validar_dados(data: Grupo, validar_obrigatorios?: boolean) {
    const erros: {
      [k: string]: string;
    } = {};

    return erros;
  }
}
