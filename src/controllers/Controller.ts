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
}
