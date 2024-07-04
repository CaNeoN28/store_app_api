import { Prisma } from "@prisma/client";
import { Erro, Fornecedor, Metodo } from "../types";
import Controller from "./Controller";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { validar_fornecedor, validar_id } from "../utils/validacao";
import ordenar_documentos from "../utils/ordenar_documentos";
import { Tabela_Fornecedor } from "../db/tabelas";

export default class Controller_Fornecedor extends Controller {
  tabela: Prisma.FornecedorDelegate;

  constructor() {
    super("fornecedor");

    this.tabela = Controller.delegar_tabela(
      "fornecedor"
    ) as Prisma.FornecedorDelegate;
  }

  get_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);

      const fornecedor = await this.tabela
        .findFirst({
          where: { id },
          select: this.selecionar_campos(),
        })
        .then((res) => res);

      if (!fornecedor) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum fornecedor",
          mensagem: "Não foi possível recuperar fornecedor",
        } as Erro;
      }

      res.status(200).send(fornecedor);
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

    const query = Controller.definir_query(
      filtros,
      ordenar_documentos(ordenar, Tabela_Fornecedor),
      this.selecionar_campos(),
      limite,
      pagina
    );

    try {
      const registros =
        (await this.tabela.count({
          where: filtros,
        })) | 0;
      const fornecedores = await this.tabela.findMany(query);

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
      const fornecedor = await this.tabela
        .create({
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
          select: this.selecionar_campos(),
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
      let fornecedor_antigo = await this.tabela.findFirst({
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

        fornecedor_novo = await this.tabela
          .update({
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
            select: this.selecionar_campos(),
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

        fornecedor_novo = await this.tabela
          .upsert({
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
            select: this.selecionar_campos(),
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

      await this.tabela
        .delete({
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

  protected selecionar_campos() {
    const selecionados: Prisma.FornecedorSelect = {
      nome: true,
      cnpj: true,
      alteracoes: {
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
      },
    };

    return selecionados;
  }
}
