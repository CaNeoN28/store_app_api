import { Prisma } from "@prisma/client";
import { Erro, Fornecedor, Metodo } from "../types";
import Controller from "./Controller";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { validar_fornecedor } from "../utils/validacao";

export default class Controller_Fornecedor extends Controller {
  protected selecionados: Prisma.FornecedorSelect;
  tabela: Prisma.FornecedorDelegate;

  constructor() {
    super("fornecedor");

    this.tabela = Controller.delegar_tabela(
      "fornecedor"
    ) as Prisma.FornecedorDelegate;

    this.selecionados = {};
    this.selecionar_todos_os_campos();
    this.selecionados.compras = {};
    this.selecionados.alteracoes = {
      select: {
        data: true,
        usuario: {
          select: {
            id: true,
            nome_completo: true,
            nome_usuario: true,
            email: true,
          },
        },
      },
      orderBy: {
        data: "desc",
      },
    };
  }

  get_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      Controller.validar_id(id);

      const fornecedor = await this.tabela
        .findFirst({
          where: { id },
          select: this.selecionados,
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
    const { nome, cnpj, ordenar, limite, pagina } = req.query;
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

    const ordenacao = this.formatar_ordenacao(
      ordenar
    ) as Prisma.FornecedorOrderByWithRelationInput;

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
    filtros: Prisma.FornecedorWhereInput,
    ordenacao: Prisma.FornecedorOrderByWithRelationInput,
    limite: number,
    pagina: number
  ) => {
    if (isNaN(pagina)) {
      pagina = Controller.PAGINA_EXIBICAO_PADRAO;
    }
    if (isNaN(limite)) {
      limite = Controller.LIMITE_EXIBICAO_PADRAO;
    }

    const query = Controller.definir_query(
      filtros,
      ordenacao,
      this.selecionados,
      limite,
      pagina
    );

    const registros =
      (await this.tabela.count({
        where: filtros,
      })) | 0;
    const fornecedores = await this.tabela.findMany(query);

    const maximo_paginas =
      registros > 0 ? 1 + Math.floor(registros / limite) : 0;

    return {
      resultado: fornecedores,
      pagina,
      maximo_paginas,
      registros,
      limite,
    };
  };

  create: RequestHandler = async (req, res, next) => {
    const usuario = req.user!;
    const { cnpj, nome }: Fornecedor = req.body;

    try {
      const fornecedor = await this.insert_one({ cnpj, nome }, usuario.id);

      res.status(201).send(fornecedor);
    } catch (err) {
      next(err);
    }
  };
  protected insert_one = async (data: Fornecedor, id_usuario?: number) => {
    validar_fornecedor(data, true);

    const fornecedor = await this.tabela
      .create({
        data: {
          cnpj: data.cnpj,
          nome: data.nome,
          alteracoes: {
            create: {
              data: new Date(),
              usuario: {
                connect: {
                  id: id_usuario,
                },
              },
            },
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
          mensagem: "Não foi possível cadastrar o fornecedor",
        } as Erro;
      });

    return fornecedor;
  };

  update_by_id: RequestHandler = async (req, res, next) => {
    const usuario = req.user!;
    const id = Number(req.params.id);
    const metodo = req.method as Metodo;

    const { cnpj, nome }: Fornecedor = req.body;
    let fornecedor: any = undefined;

    try {
      Controller.validar_id(id);
      let atualizacao_verdadeira = false;

      if (metodo == "PATCH") {
        validar_fornecedor({ cnpj, nome });
        atualizacao_verdadeira = cnpj || nome ? true : false;
      } else if (metodo == "PUT") {
        validar_fornecedor({ cnpj, nome }, true);
        atualizacao_verdadeira = true;
      }

      fornecedor = await this.tabela
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
          select: this.selecionados,
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

      res.status(200).send(fornecedor);
    } catch (err) {
      next(err);
    }
  };
  remove_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      Controller.validar_id(id);

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
}
