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
    this.selecionados.senha = false;
    this.selecionados.grupos = {
      select: {
        id: true,
        nome: true,
        acessos: {
          select: {
            metodo: true,
            tabela: true,
          },
        },
      },
    };
  }

  list: RequestHandler = async (req, res, next) => {
    const { nome_completo, nome_usuario, email, nome_grupo } = req.query;
    const filtros: Prisma.UsuarioWhereInput = {};

    if (nome_completo) {
      filtros.nome_completo = {
        contains: String(nome_completo),
        mode: "insensitive",
      };
    }

    if (nome_usuario) {
      filtros.nome_usuario = {
        contains: String(nome_usuario),
        mode: "insensitive",
      };
    }

    if (email) {
      filtros.email = {
        contains: String(email),
        mode: "insensitive",
      };
    }

    if (nome_grupo) {
      filtros.grupos = {
        some: {
          nome: {
            contains: String(nome_grupo),
            mode: "insensitive",
          },
        },
      };
    }

    try {
      const resposta = await this.find_many(filtros, {}, 10, 1);

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
