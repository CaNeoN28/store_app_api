import { Prisma } from "@prisma/client";
import { Erro, Fornecedor, Metodo } from "../types";
import Controller from "./Controller";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { validar_fornecedor, validar_id } from "../utils/validacao";
import ordenar_documentos from "../utils/ordenar_documentos";
import { Tabela_Alteracoes_Fornecedor, Tabela_Fornecedor } from "../db/tabelas";
import definir_query from "../utils/definir_query";

export default class Controller_Fornecedor extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    let pagina_alteracoes = Number(req.query.pagina_alteracoes),
      limite_alteracoes = Number(req.query.limite_alteracoes);

    if (isNaN(pagina_alteracoes))
      pagina_alteracoes = Controller.PAGINA_EXIBICAO_PADRAO;
    if (isNaN(limite_alteracoes))
      limite_alteracoes = Controller.LIMITE_EXIBICAO_PADRAO;

    const id = Number(req.params.id);

    try {
      validar_id(id);

      const registros_alteracoes = await Tabela_Alteracoes_Fornecedor.count({
        where: {
          fornecedor_id: id,
        },
      });
      const maximo_paginas =
        registros_alteracoes > 0
          ? 1 + Math.floor(registros_alteracoes / limite_alteracoes)
          : 0;

      const fornecedor = await Tabela_Fornecedor.findFirst({
        where: { id },
        select: this.selecionar_campos(
          true,
          limite_alteracoes,
          pagina_alteracoes
        ),
      }).then((res) => res);

      if (!fornecedor) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum fornecedor",
          mensagem: "Não foi possível recuperar fornecedor",
        } as Erro;
      }

      res.status(200).send({
        ...fornecedor,
        alteracoes: {
          resultado: fornecedor.alteracoes,
          pagina: pagina_alteracoes,
          limite: limite_alteracoes,
          registros: registros_alteracoes,
          maximo_paginas: maximo_paginas,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  list: RequestHandler = async (req, res, next) => {
    const { nome, cnpj, ordenar } = req.query;
    let limite = Number(req.query.limite);
    let pagina = Number(req.query.pagina);

    if (isNaN(pagina)) {
      pagina = Controller.PAGINA_EXIBICAO_PADRAO;
    }
    if (isNaN(limite)) {
      limite = Controller.LIMITE_EXIBICAO_PADRAO;
    }

    const filtros: Prisma.FornecedorWhereInput = {};

    if (nome) {
      filtros.nome = {
        contains: String(nome),
        mode: "insensitive",
      };
    }

    if (cnpj) {
      filtros.cnpj = String(cnpj);
    }

    const query = definir_query(
      filtros,
      ordenar_documentos(ordenar, Tabela_Fornecedor),
      this.selecionar_campos(),
      limite,
      pagina
    );

    try {
      const registros =
        (await Tabela_Fornecedor.count({
          where: filtros,
        })) | 0;
      const fornecedores = await Tabela_Fornecedor.findMany(query);

      const maximo_paginas =
        registros > 0 ? 1 + Math.floor(registros / limite) : 0;

      res.status(200).send({
        resultado: fornecedores,
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
    const usuario = req.user!;
    const { cnpj, nome }: Fornecedor = req.body;

    try {
      const fornecedor = await Tabela_Fornecedor.create({
        data: {
          cnpj: cnpj,
          nome: nome,
          alteracoes: {
            create: {
              data: new Date(),
              usuario: {
                connect: {
                  id: usuario.id,
                },
              },
            },
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
            mensagem: "Não foi possível cadastrar o fornecedor",
          } as Erro;
        });

      res.status(201).send(fornecedor);
    } catch (err) {
      next(err);
    }
  };
  update_by_id: RequestHandler = async (req, res, next) => {
    const usuario = req.user!;
    const id = Number(req.params.id);
    const metodo = req.method as Metodo;

    const { cnpj, nome }: Fornecedor = req.body;

    try {
      let fornecedor_antigo = await Tabela_Fornecedor.findFirst({
        where: {
          id,
        },
      });
      let fornecedor_novo: any = undefined;

      validar_id(id);
      let atualizacao_verdadeira = false;

      if (metodo == "PATCH") {
        validar_fornecedor({ cnpj, nome });
        atualizacao_verdadeira = cnpj || nome ? true : false;

        fornecedor_novo = await Tabela_Fornecedor.update({
          where: { id },
          data: {
            cnpj,
            nome,
            alteracoes: atualizacao_verdadeira
              ? {
                  create: {
                    data: new Date(),
                    usuario: {
                      connect: {
                        id: usuario.id,
                      },
                    },
                  },
                }
              : {},
          },
          select: this.selecionar_campos(true),
        })
          .then((res) => res)
          .catch((err) => {
            console.log(err);
            const { codigo, erro } = verificar_erro_prisma(err);

            throw {
              codigo,
              erro,
              mensagem: "Não foi possível atualizar o fornecedor",
            } as Erro;
          });
      } else if (metodo == "PUT") {
        validar_fornecedor({ cnpj, nome }, true);
        atualizacao_verdadeira = true;

        fornecedor_novo = await Tabela_Fornecedor.upsert({
          where: { id },
          create: {
            id,
            cnpj,
            nome,
            alteracoes: {
              create: {
                data: new Date(),
                usuario: {
                  connect: {
                    id: usuario.id,
                  },
                },
              },
            },
          },
          update: {
            cnpj,
            nome,
            alteracoes: {
              create: {
                data: new Date(),
                usuario: {
                  connect: {
                    id: usuario.id,
                  },
                },
              },
            },
          },
          select: this.selecionar_campos(true),
        })
          .then((res) => res)
          .catch((err) => {
            console.log(err);
            const { codigo, erro } = verificar_erro_prisma(err);

            throw {
              codigo,
              erro,
              mensagem: "Não foi possível atualizar o fornecedor",
            } as Erro;
          });
      }

      res.status(fornecedor_antigo ? 200 : 201).send(fornecedor_novo);
    } catch (err) {
      next(err);
    }
  };
  remove_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);

      await Tabela_Fornecedor.delete({
        where: {
          id,
        },
      })
        .then((_) => {
          res.status(204).send();
        })
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível remover fornecedor",
          } as Erro;
        });
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos(
    exibir_alteracoes?: boolean,
    limite_alteracoes = 10,
    pagina_alteracoes = 1
  ) {
    const selecionados: Prisma.FornecedorSelect = {
      id: true,
      nome: true,
      cnpj: true,
      alteracoes: exibir_alteracoes ? {
        orderBy: {
          data: "desc",
        },
        select: {
          data: true,
          usuario: {
            select: {
              id: true,
              email: true,
              nome_usuario: true,
              numero_telefone: true,
            },
          },
        },
        skip: (pagina_alteracoes - 1) * limite_alteracoes,
        take: limite_alteracoes,
      }: false,
    };

    return selecionados;
  }
}
