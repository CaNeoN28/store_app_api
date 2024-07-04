import { RequestHandler } from "express";

export default class Controller {
  static PAGINA_EXIBICAO_PADRAO = 1;
  static LIMITE_EXIBICAO_PADRAO = 10;

  //Métodos referentes às requests
  get_id: RequestHandler = async (req, res, next) => {};
  list: RequestHandler = async (req, res, next) => {};
  create: RequestHandler = async (req, res, next) => {};
  update_by_id: RequestHandler = async (req, res, next) => {};
  remove_by_id: RequestHandler = async (req, res, next) => {};
}
