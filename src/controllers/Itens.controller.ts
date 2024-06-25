import { RequestHandler } from "express";
import Controller from "./Controller";

export default class Controller_Itens extends Controller {
  constructor() {
    super("item");
  }

  get: RequestHandler = (req, res, next) => {
    const itens = this.findMany();

    res.send(itens);
  };
}
