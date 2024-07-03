import { Prisma } from "@prisma/client";
import { Fornecedor } from "../types";
import Controller from "./Controller";
import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

export default class Controller_Fornecedor extends Controller {
  protected selecionados: Prisma.FornecedorSelect;
  tabela: Prisma.FornecedorDelegate;

  constructor() {
    super("fornecedor");

    this.tabela = Controller.delegar_tabela(
      "fornecedor"
    ) as Prisma.FornecedorDelegate;

    this.selecionados = {};
    this.selecionar_todos_os_campos();
    this.selecionados.compras = {};
  }

  list: RequestHandler = async (req, res, next) => {
    try {
      const resposta = await this.find_many({}, {}, 10, 1);

      res.status(200).send(resposta);
    } catch (err) {
      next(err);
    }
  };

  protected find_many = async (
    filtros: Prisma.FornecedorWhereInput,
    ordenacao: Prisma.FornecedorOrderByWithRelationInput,
    limite: number,
    pagina: number
  ) => {
    const query = Controller.definir_query(
      filtros,
      ordenacao,
      this.selecionados,
      limite,
      pagina
    );

    const fornecedores = await this.tabela.findMany(query);

    return fornecedores
  };

  protected validar_dados(data: Fornecedor, validar_obrigatorios?: boolean) {}
}
