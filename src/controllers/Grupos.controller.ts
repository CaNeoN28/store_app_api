import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Grupo, Erro, Metodo } from "../types";
import { validar_grupo, validar_id } from "../utils/validacao";
import ordenar_documentos from "../utils/ordenar_documentos";
import { Tabela_Grupo } from "../db/tabelas";

export default class Controller_Grupos extends Controller {

  get_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);

      const grupo = await Tabela_Grupo
        .findFirst({
          where: { id },
          select: this.selecionar_campos(),
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

      res.status(200).send(grupo);
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

    const query = Controller.definir_query(
      filtros,
      ordenar_documentos(ordenar, Tabela_Grupo),
      this.selecionar_campos(),
      limite,
      pagina
    );

    try {
      const registros = await Tabela_Grupo.count({ where: filtros });
      const grupos = await Tabela_Grupo
        .findMany(query)
        .then((res) => res)
        .catch((err) => {
          const {codigo, erro} = verificar_erro_prisma(err);
        });

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

      const grupo = await Tabela_Grupo
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
          select: this.selecionar_campos(),
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
        grupo_novo = await Tabela_Grupo
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
            select: this.selecionar_campos(),
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
        grupo_novo = await Tabela_Grupo
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
            select: this.selecionar_campos(),
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
      await Tabela_Grupo
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

  protected selecionar_campos() {
    const selecionados: Prisma.GrupoSelect = {
      id: true,
      nome: true,
      acessos: {
        select: {
          metodo: true,
          tabela: true,
        },
      },
      usuarios: {
        select: {
          id: true,
          nome_usuario: true,
          email: true,
          nome_completo: true,
          numero_telefone: true,
          foto_url: true,
        },
      },
    };

    return selecionados;
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
