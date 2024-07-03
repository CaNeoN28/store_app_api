import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Grupo, Erro, Metodo } from "../types";
import { METODOS, TABELAS } from "../utils/globals";
import { validar_grupo } from "../utils/validacao";

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
    const { nome, ordenar } = req.query;
    let limite = Number(req.query.number),
      pagina = Number(req.query.pagina);

    if (isNaN(pagina)) {
      pagina = Controller.PAGINA_EXIBICAO_PADRAO;
    }
    if (isNaN(limite)) {
      limite = Controller.LIMITE_EXIBICAO_PADRAO;
    }

    const filtros: Prisma.GrupoWhereInput = {};

    if (nome) {
      filtros.nome = {
        contains: String(nome),
        mode: "insensitive",
      };
    }

    const ordenacao: Prisma.GrupoOrderByWithRelationInput =
      this.formatar_ordenacao(ordenar) as Prisma.GrupoOrderByWithRelationInput;

    const query = Controller.definir_query(
      filtros,
      ordenacao,
      this.selecionados,
      limite,
      pagina
    );

    try {
      const registros = await this.tabela.count({ where: filtros });
      const grupos = await this.tabela.findMany(query);

      const maximo_paginas =
        registros > 0 ? 1 + Math.floor(registros / limite) : 0;

      res.status(200).send({
        resultado: grupos,
        pagina,
        maximo_paginas,
        registros,
        limite,
      });
    } catch (err) {
      next(err);
    }
  };
  create: RequestHandler = async (req, res, next) => {
    const { nome, acessos, usuarios }: Grupo = req.body;

    try {
      validar_grupo({ acessos, nome, usuarios });

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
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível criar o grupo",
          } as Erro;
        });

      res.status(201).send(grupo);
    } catch (err) {
      next(err);
    }
  };
  update_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);
    const { acessos, nome, usuarios }: Grupo = req.body;

    const metodo = req.method as Metodo;

    try {
      let grupo: any = undefined;

      if (metodo == "PATCH") {
        grupo = await this.tabela
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
      } else if (metodo == "PUT") {
        grupo = await this.tabela
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
      }

      if (acessos) {
        await this.remover_acessos_nao_utilizados();
      }

      res.status(200).send(grupo);
    } catch (err) {
      next(err);
    }
  };
  remove_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      await this.tabela
        .delete({
          where: {
            id,
          },
        })
        .then()
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível remover o grupo",
          } as Erro;
        });

      await this.remover_acessos_nao_utilizados();

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

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
