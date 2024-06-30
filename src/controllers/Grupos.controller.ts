import { ParamsDictionary } from "express-serve-static-core";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { RequestHandler } from "express";
import { ParsedQs } from "qs";
import verificar_codigo_prisma from "../utils/verificar_codigo_prisma";
import { Erro } from "../types/resposta";

type Tabela =
  | "ITEM"
  | "GRUPO"
  | "USUARIO"
  | "FORNECEDOR"
  | "CLIENTE"
  | "UNIDADE"
  | "COMPRA"
  | "VENDA";

type Metodo = "GET" | "PUT" | "PATCH" | "DELETE" | "POST";

const METODOS: Metodo[] = ["DELETE", "GET", "PATCH", "PUT", "POST"];
const TABELAS: Tabela[] = [
  "CLIENTE",
  "COMPRA",
  "FORNECEDOR",
  "GRUPO",
  "ITEM",
  "UNIDADE",
  "UNIDADE",
  "USUARIO",
  "VENDA",
];

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

    this.validar_dados({ nome, acessos }, true);

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
                    tabela: a.tabela,
                  },
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
      [k: string]: any;
    } = {};

    const { nome, acessos, id } = data;

    if (validar_obrigatorios && !nome) {
      erros.nome = "Nome do grupo é obrigatório";
    }

    if (id && isNaN(id)) {
      erros.id = "Id inválido";
    }

    if (acessos) {
      const erros_acessos: {
        [k: number]: {
          tabela?: string;
          metodo?: string;
        };
      } = {};

      for (let i = 0; i < acessos.length; i++) {
        const acesso = acessos[i];

        if (!METODOS.find((m) => m == acesso.metodo)) {
          erros_acessos[i] = {};
          erros_acessos[i].metodo = "Método inválido";
        }

        if (!TABELAS.find((t) => t == acesso.tabela)) {
          if (!erros_acessos[i]) erros_acessos[i] = {};
          erros_acessos[i].tabela = "Tabela inválida";
        }
      }

      if (Object.keys(erros_acessos).length > 0) {
        erros.acessos = erros_acessos;
      }
    }

    if (Object.keys(erros).length > 0) {
      throw {
        codigo: 400,
        mensagem: "Erro de validação de grupo",
        erro: erros,
      } as Erro;
    }
  }
}
