import { RequestHandler } from "express-serve-static-core";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";

interface Grupo {
  id?: number;
  nome?: string;
}

export default class Controller_Grupos extends Controller {
  constructor() {
    super("grupo");

    const selecionados: Prisma.GrupoSelect = {};

    this.set_selecionados(selecionados);
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

    this.set_filtros(filtros);
    this.set_ordenacao(ordenar);
    this.set_limite(limite);
    this.set_pagina(pagina);

    const resposta = await this.find_many();

    res.send(resposta);
  };

  protected validar_dados(data: Grupo, validar_obrigatorios?: boolean) {
    const erros: {
      [k: string]: string;
    } = {};

    return erros;
  }

  protected set_filtros(filtros: Prisma.GrupoWhereInput): void {
    super.set_filtros(filtros);
  }

  protected set_selecionados(selecionados: Prisma.GrupoSelect): void {
    super.set_selecionados(selecionados);
  }
}
