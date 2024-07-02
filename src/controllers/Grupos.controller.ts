import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Grupo, Erro } from "../types";
import { METODOS, TABELAS } from "../utils/globals";

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
    this.selecionados.usuarios = {
      select: {
        id: true,
        nome_completo: true,
        nome_usuario: true,
        email: true,
        foto_url: true,
        numero_telefone: true,
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
    const { nome, acessos, usuarios }: Grupo = req.body;

    try {
      const resposta = await this.insert_one({ acessos, nome, usuarios });

      res.status(201).send(resposta);
    } catch (err) {
      next(err);
    }
  };
  protected insert_one = async (data: Grupo) => {
    const { acessos, nome, usuarios } = data;

    this.validar_dados({ nome, acessos, usuarios }, true);

    try {
      const grupo = await this.tabela
        .create({
          data: {
            nome,
            acessos: {
              connectOrCreate:
                acessos &&
                acessos.map((a) => ({
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
            usuarios: {
              connect:
                usuarios &&
                usuarios.map((u) => ({
                  id: u.id,
                })),
            },
          },
          select: this.selecionados,
        })
        .then((res) => res);

      return grupo;
    } catch (err) {
      const { codigo, erro } = verificar_erro_prisma(err);

      throw {
        mensagem: "Não foi possível criar grupo",
        codigo,
        erro,
      } as Erro;
    }
  };

  update_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);
    const { acessos, nome, usuarios }: Grupo = req.body;
    const metodo = req.method as "PATCH" | "PUT";

    const data = {
      acessos,
      nome,
      usuarios,
    };

    try {
      const resposta =
        metodo == "PATCH"
          ? await this.update_one(id, data)
          : metodo == "PUT" && (await this.upsert_one(id, data));

      res.status(200).send(resposta);
    } catch (err) {
      next(err);
    }
  };
  protected update_one = async (id: number, data: Grupo) => {
    Controller.validar_id(id);
    this.validar_dados(data);

    const { acessos, nome, usuarios } = data;

    const grupo_novo = await this.tabela
      .update({
        where: { id },
        data: {
          nome: nome,
          acessos: {
            set: [],
            connectOrCreate:
              acessos &&
              acessos.map((a) => ({
                where: {
                  tabela_metodo: {
                    metodo: a.metodo,
                    tabela: a.tabela,
                  },
                },
                create: {
                  metodo: a.metodo,
                  tabela: a.tabela,
                },
              })),
          },
          usuarios: {
            connect:
              usuarios &&
              usuarios.map((u) => ({
                id: u.id,
              })),
          },
        },
        select: this.selecionados,
      })
      .then((res) => res)
      .catch((err) => {
        const { codigo, erro } = verificar_erro_prisma(err);

        throw {
          codigo,
          erro,
          mensagem: "Não foi possível atualizar o grupo",
        } as Erro;
      });

    if (acessos) {
      await this.remover_acessos_nao_utilizados();
    }

    return grupo_novo;
  };
  protected upsert_one = async (id: number, data: Grupo) => {
    Controller.validar_id(id);
    this.validar_dados(data, true);

    const { acessos, nome, usuarios } = data;

    const grupo_novo = await this.tabela
      .upsert({
        where: { id },
        create: {
          id,
          nome,
          acessos: {
            connectOrCreate:
              acessos &&
              acessos.map((a) => ({
                where: {
                  tabela_metodo: {
                    metodo: a.metodo,
                    tabela: a.tabela,
                  },
                },
                create: {
                  metodo: a.metodo,
                  tabela: a.tabela,
                },
              })),
          },
          usuarios: {
            connect:
              usuarios &&
              usuarios.map((u) => ({
                id: u.id,
              })),
          },
        },
        update: {
          nome,
          acessos: {
            set: [],
            connectOrCreate:
              acessos &&
              acessos.map((a) => ({
                where: {
                  tabela_metodo: {
                    metodo: a.metodo,
                    tabela: a.tabela,
                  },
                },
                create: {
                  metodo: a.metodo,
                  tabela: a.tabela,
                },
              })),
          },
          usuarios: {
            set: [],
            connect:
              usuarios &&
              usuarios.map((u) => ({
                id: u.id,
              })),
          },
        },
        select: this.selecionados,
      })
      .then((res) => res)
      .catch((err) => {
        const { codigo, erro } = verificar_erro_prisma(err);

        throw {
          codigo,
          erro,
          mensagem: "Não foi possível salvar o grupo",
        } as Erro;
      });

    if (acessos) {
      await this.remover_acessos_nao_utilizados();
    }

    return grupo_novo;
  };

  remove_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      await this.delete_one(id);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  protected delete_one = async (id: number) => {
    Controller.validar_id(id);

    try {
      await this.tabela.delete({
        where: {
          id,
        },
      });

      await this.remover_acessos_nao_utilizados();
    } catch (err) {
      const { codigo, erro } = verificar_erro_prisma(err);

      throw {
        codigo,
        erro,
        mensagem: "Não foi possível remover o grupo",
      } as Erro;
    }
  };

  protected validar_dados(data: Grupo, validar_obrigatorios?: boolean) {
    const erros: {
      [k: string]: any;
    } = {};

    const { nome, acessos, usuarios, id } = data;

    if (validar_obrigatorios && !nome) {
      erros.nome = "Nome do grupo é obrigatório";
    }

    if (id && isNaN(id)) {
      erros.id = "Id inválido";
    }

    if (acessos) {
      if (!Array.isArray(acessos)) {
        erros.acessos = "Acessos inválidos, deve ser uma lista";
      } else {
        const erros_acessos: {
          [k: number]: {
            tabela?: string;
            metodo?: string;
          };
        } = {};

        for (let i = 0; i < acessos.length; i++) {
          const acesso = acessos[i];

          if (!acesso.metodo) {
            erros_acessos[i] = {};
            erros_acessos[i].metodo = "Método é obrigatório";
          } else if (!METODOS.find((m) => m == acesso.metodo)) {
            erros_acessos[i] = {};
            erros_acessos[i].metodo = "Método inválido";
          }

          if (!acesso.tabela) {
            erros_acessos[i] = {};
            erros_acessos[i].tabela = "Tabela é obrigatório";
          } else if (!TABELAS.find((t) => t == acesso.tabela)) {
            if (!erros_acessos[i]) erros_acessos[i] = {};
            erros_acessos[i].tabela = "Tabela inválida";
          }
        }

        if (Object.keys(erros_acessos).length > 0) {
          erros.acessos = erros_acessos;
        }
      }
    }

    if (usuarios) {
      if (!Array.isArray(usuarios)) {
        erros.usuarios = "Usuários deve ser uma lista";
      } else if (usuarios.length > 0) {
        usuarios.map((u, i) => {
          if (!u.id) {
            if (!erros.usuario) {
              erros.usuario = {};
            }

            erros.usuario[i] = "O id de um usuário é necessário";
          }
        });
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

  protected async remover_acessos_nao_utilizados() {
    const tabela_acessos = Controller.delegar_tabela(
      "acesso"
    ) as Prisma.AcessoDelegate;

    await tabela_acessos.deleteMany({
      where: {
        grupos: {
          none: {
            id: {
              gt: 0,
            },
          },
        },
      },
    });
  }
}
