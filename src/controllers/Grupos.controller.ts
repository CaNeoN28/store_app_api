import { ParamsDictionary } from "express-serve-static-core";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { RequestHandler } from "express";
import { ParsedQs } from "qs";
import verificar_codigo_prisma from "../utils/verificar_codigo_prisma";
import { Erro } from "../types/resposta";

type Tabela = "ITEM" | "GRUPO";

type Metodo = "GET" | "PUT" | "PATCH" | "DELETE";

interface Grupo {
  id?: number;
  nome: string;
  acessos: [
    {
      tabela: Tabela;
      metodo: Metodo;
    }
  ];
}

export default class Controller_Grupos extends Controller {
  protected selecionados: Prisma.GrupoSelect;

  tabela: Prisma.GrupoDelegate;
  constructor() {
    super("grupo");

    this.tabela = Controller.delegar_tabela("grupo") as Prisma.GrupoDelegate;
    this.selecionados = {};
    this.selecionar_todos_os_campos();
    this.selecionados.acessos = {
      select: {
        metodo: true,
        tabela: true,
      },
    };
  }

  list: RequestHandler = async (req, res, next) => {
    const { nome, ordenar, limite, pagina } = req.query;
    const filtros: Prisma.GrupoWhereInput = {};
    const ordenacao: Prisma.GrupoOrderByWithRelationInput =
      this.formatar_ordenacao(ordenar) as Prisma.GrupoOrderByWithRelationInput;

    if (nome) {
      filtros.nome = {
        contains: String(nome),
        mode: "insensitive",
      };
    }

    try {
      const resposta = await this.find_many(
        filtros,
        ordenacao,
        Number(limite),
        Number(pagina)
      );

      res.status(200).send(resposta);
    } catch (err) {
      next(err);
    }
  };
  protected find_many = async (
    filtros: Prisma.GrupoWhereInput,
    ordenacao: Prisma.GrupoOrderByWithRelationInput,
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

    const registros = await this.tabela.count({ where: filtros });
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

  create: RequestHandler = async (req, res, next) => {
    const { nome, acessos }: Grupo = req.body;

    try {
      const resposta = await this.insert_one({ acessos, nome });

      res.status(201).send(resposta);
    } catch (err) {
      next(err);
    }
  };
  protected insert_one = async (data: Grupo) => {
    const { acessos, nome } = data;

    try {
      const grupo = await this.tabela
        .create({
          data: {
            nome,
            acessos: {
              connectOrCreate: acessos.map((a) => ({
                where: {
                  tabela_metodo: {
                    metodo: a.metodo,
                    tabela: a.tabela
                  }                  
                },
                create: {
                  tabela: a.tabela,
                  metodo: a.metodo,
                },
              })),
            },
          },
          select: this.selecionados,
        })
        .then((res) => res);

      return grupo;
    } catch (err) {
      const { codigo, erro } = verificar_codigo_prisma(err);

      throw {
        mensagem: "Não foi possível criar grupo",
        codigo,
        erro,
      } as Erro;
    }
  };

  protected validar_dados(data: Grupo, validar_obrigatorios?: boolean) {
    const erros: {
      [k: string]: string;
    } = {};

    return erros;
  }
}
