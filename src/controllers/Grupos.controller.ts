import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Grupo, Erro, Metodo } from "../types";
import { validar_grupo, validar_id } from "../utils/validacao";
import ordenar_documentos from "../utils/ordenar_documentos";
import { Tabela_Acessos, Tabela_Grupo, Tabela_Usuario } from "../db/tabelas";
import definir_query from "../utils/definir_query";

export default class Controller_Grupos extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    let limite_usuarios = Number(req.query.limite_usuarios),
      pagina_usuarios = Number(req.query.pagina_usuarios);

    if (isNaN(limite_usuarios))
      limite_usuarios = Controller.LIMITE_EXIBICAO_PADRAO;
    if (isNaN(pagina_usuarios))
      pagina_usuarios = Controller.PAGINA_EXIBICAO_PADRAO;

    const id = Number(req.params.id);

    try {
      validar_id(id);

      const registros_usuarios = await Tabela_Usuario.count({
        where: {
          grupos: {
            some: {
              id,
            },
          },
        },
      });

      const maximo_paginas =
        registros_usuarios > 0
          ? Math.floor(registros_usuarios / limite_usuarios)
          : 0;

      const grupo = await Tabela_Grupo.findFirst({
        where: { id },
        select: this.selecionar_campos(true, limite_usuarios, pagina_usuarios),
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível recuperar o grupo",
          } as Erro;
        });

      if (!grupo) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum grupo",
          mensagem: "Não foi possível recuperar grupo",
        } as Erro;
      }

      res.status(200).send({
        ...grupo,
        usuarios: {
          resultado: grupo.usuarios,
          pagina: pagina_usuarios,
          maximo_paginas,
          registros: registros_usuarios,
          limite: limite_usuarios,
        },
      });
    } catch (err) {
      next(err);
    }
  };
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

    const query = definir_query(
      filtros,
      ordenar_documentos(ordenar, Tabela_Grupo),
      this.selecionar_campos(),
      limite,
      pagina
    );

    try {
      const registros = await Tabela_Grupo.count({ where: filtros });
      const grupos = await Tabela_Grupo.findMany(query);

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
      validar_grupo({ acessos, nome, usuarios }, true);

      const grupo = await Tabela_Grupo.create({
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
        select: this.selecionar_campos(true),
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
      let grupo_antigo = await Tabela_Grupo.findFirst({
        where: { id },
      });
      validar_id(id);
      let grupo_novo: any = undefined;

      if (metodo == "PATCH") {
        grupo_novo = await Tabela_Grupo.update({
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
          select: this.selecionar_campos(true),
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
        grupo_novo = await Tabela_Grupo.upsert({
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
          select: this.selecionar_campos(true),
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

      res.status(grupo_antigo ? 200 : 201).send(grupo_novo);
    } catch (err) {
      next(err);
    }
  };
  remove_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);
      await Tabela_Grupo.delete({
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

  protected selecionar_campos(
    exibir_usuarios?: boolean,
    limite_usuarios = 10,
    pagina_usuarios = 1
  ) {
    const selecionados: Prisma.GrupoSelect = {
      id: true,
      nome: true,
      acessos: {
        select: {
          metodo: true,
          tabela: true,
        },
      },
      usuarios: exibir_usuarios
        ? {
            select: {
              id: true,
              nome_usuario: true,
              email: true,
              nome_completo: true,
              numero_telefone: true,
              foto_url: true,
            },
            skip: (pagina_usuarios - 1) * limite_usuarios,
            take: limite_usuarios,
          }
        : false,
    };

    return selecionados;
  }

  protected async remover_acessos_nao_utilizados() {
    await Tabela_Acessos.deleteMany({
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
