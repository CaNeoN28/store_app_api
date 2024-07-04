import { RequestHandler } from "express";
import prisma from "../db/prisma";
import { Tabela_Prisma } from "../types";

export default class Controller {
  static PAGINA_EXIBICAO_PADRAO = 1;
  static LIMITE_EXIBICAO_PADRAO = 10;


  protected ordenacao: any;

  //Métodos referentes às requests
  get_id: RequestHandler = async (req, res, next) => {};
  list: RequestHandler = async (req, res, next) => {};
  create: RequestHandler = async (req, res, next) => {};
  update_by_id: RequestHandler = async (req, res, next) => {};
  remove_by_id: RequestHandler = async (req, res, next) => {};

  static delegar_tabela(tabela: Tabela_Prisma) {
    return prisma[tabela];
  }

  static definir_query(filtros: any, ordenacao: any, selecionados: any, limite: number, pagina: number){
    if (isNaN(limite)) limite = Controller.LIMITE_EXIBICAO_PADRAO;
    if (isNaN(pagina)) pagina = Controller.PAGINA_EXIBICAO_PADRAO;

    return {
      where: filtros,
      orderBy: ordenacao,
      select: selecionados,
      skip: (pagina - 1) * limite,
      take: limite,
    }
  }
}
