import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import Controller from "./Controller";

export default class Controller_Unidades extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    try {
      res.send("Recuperar unidade");
    } catch (err) {}
  };
  create: RequestHandler = async (req, res, next) => {
    try {
      res.send("Criar unidade");
    } catch (err) {}
  };
  list: RequestHandler = async (req, res, next) => {
    try {
      res.send("Listar unidades");
    } catch (err) {}
  };
  update_by_id: RequestHandler = async (req, res, next) => {
    try {
      res.send("Atualizar unidade");
    } catch (err) {}
  };
  remove_by_id: RequestHandler = async (req, res, next) => {
    try {
      res.send("Remover unidade");
    } catch (err) {}
  };

  protected selecionar_campos() {}
}
