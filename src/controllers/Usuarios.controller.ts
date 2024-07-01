import { Prisma } from "@prisma/client";
import { Usuario } from "../types";
import Controller from "./Controller";
import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

export default class Controller_Usuarios extends Controller {
  tabela: Prisma.UsuarioDelegate;

  protected selecionados: Prisma.UsuarioSelect;

  constructor() {
    super("usuario");

    this.tabela = Controller.delegar_tabela(
      "usuario"
    ) as Prisma.UsuarioDelegate;

    this.selecionados = {};
    this.selecionar_todos_os_campos();
  }

  list: RequestHandler = async (req, res, next) => {
    const {} = req.body;

    try {
      const resposta = await this.find_many({}, {}, 10, 1);

      res.status(200).send(resposta);
    } catch (err) {
      next(err);
    }
  };
  protected find_many = async (
    filtros: Prisma.UsuarioWhereInput,
    ordenacao: Prisma.UsuarioOrderByWithRelationInput,
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

    const registros = (await this.tabela.count({ where: filtros })) | 0;
    const resultado = await this.tabela.findMany(query);

    const maximo_paginas =
      registros > 0 ? 1 + Math.floor(registros / limite) : 0;

    return {
      resultado,
      pagina,
      maximo_paginas,
      registros,
      limite,
    };
  };

  protected validar_dados(
    data: Usuario,
    validar_obrigatorios?: boolean | undefined
  ) {}
}
