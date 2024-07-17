import { Prisma } from "@prisma/client";
import { Erro, Fornecedor, Metodo } from "../types";
import Controller from "./Controller";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { validar_fornecedor, validar_id } from "../utils/validacao";
import ordenar_documentos from "../utils/ordenar_documentos";
import { Tabela_Fornecedor } from "../db/tabelas";
import definir_query from "../utils/definir_query";
import { extrair_paginacao } from "../utils/extracao_request";

export default class Controller_Fornecedor extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);

      const fornecedor = await Tabela_Fornecedor.findFirst({
        where: { id },
        select: this.selecionar_campos(),
      }).then((res) => res);

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
    const { limite, pagina } = extrair_paginacao(req);

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
    const { cnpj, nome }: Fornecedor = req.body;

    try {
      const fornecedor = await Tabela_Fornecedor.create({
        data: {
          cnpj: cnpj,
          nome: nome,
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

      if (metodo == "PATCH") {
        validar_fornecedor({ cnpj, nome });

        fornecedor_novo = await Tabela_Fornecedor.update({
          where: { id },
          data: {
            cnpj,
            nome,
          },
          select: this.selecionar_campos(),
        })
          .then((res) => res)
          .catch((err) => {
            const { codigo, erro } = verificar_erro_prisma(err);

            throw {
              codigo,
              erro,
              mensagem: "Não foi possível atualizar o fornecedor",
            } as Erro;
          });
      } else if (metodo == "PUT") {
        validar_fornecedor({ cnpj, nome }, true);

        fornecedor_novo = await Tabela_Fornecedor.upsert({
          where: { id },
          create: {
            id,
            cnpj,
            nome,
          },
          update: {
            cnpj,
            nome,
          },
          select: this.selecionar_campos(),
        })
          .then((res) => res)
          .catch((err) => {
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

  protected selecionar_campos() {
    const selecionados: Prisma.FornecedorSelect = {
      id: true,
      nome: true,
      cnpj: true,
    };

    return selecionados;
  }
}
