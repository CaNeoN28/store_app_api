import { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Item, Erro, Metodo } from "../types";
import { validar_id, validar_item } from "../utils/validacao";
import ordenar_documentos from "../utils/ordenar_documentos";
import { Tabela_Alteracoes_Item, Tabela_Item } from "../db/tabelas";
import definir_query from "../utils/definir_query";
import { extrair_paginacao } from "../utils/extracao_request";
import fs from "fs";
import path from "path";

const API_URL = process.env.API_URL || "";

export default class Controller_Itens extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    let limite_alteracoes = Number(req.query.limite_alteracoes),
      pagina_alteracoes = Number(req.query.pagina_alteracoes);

    if (isNaN(limite_alteracoes))
      limite_alteracoes = Controller.LIMITE_EXIBICAO_PADRAO;
    if (isNaN(pagina_alteracoes))
      pagina_alteracoes = Controller.PAGINA_EXIBICAO_PADRAO;

    const id = Number(req.params.id);

    try {
      validar_id(id);
      const registros_alteracoes = await Tabela_Alteracoes_Item.count({
        where: {
          item_id: id,
        },
      });

      const maximo_paginas =
        registros_alteracoes > 0
          ? Math.floor(registros_alteracoes / limite_alteracoes) + 1
          : 0;

      const item = await Tabela_Item.findFirst({
        where: {
          id,
        },
        select: this.selecionar_campos(
          true,
          limite_alteracoes,
          pagina_alteracoes
        ),
      });

      if (!item) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum item",
          mensagem: "Não foi possível recuperar o item",
        } as Erro;
      }

      res.status(200).send({
        ...item,
        alteracoes: {
          resultado: item.alteracoes,
          pagina: pagina_alteracoes,
          maximo_paginas,
          registros: registros_alteracoes,
          limite: limite_alteracoes,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  list: RequestHandler = async (req, res, next) => {
    const { nome, em_desconto, ordenar } = req.query;

    const { limite, pagina } = extrair_paginacao(req);

    const filtros: Prisma.ItemWhereInput = {};

    if (nome) {
      filtros.nome = {
        contains: String(nome),
        mode: "insensitive",
      };
    }

    if (em_desconto && String(em_desconto) == "SIM") {
      filtros.desconto_porcentagem = {
        not: 0.0,
      };

      filtros.validade_desconto = {
        gt: new Date(),
      };
    }

    const query = definir_query(
      filtros,
      ordenar_documentos(ordenar, Tabela_Item),
      this.selecionar_campos(),
      limite,
      pagina
    );

    try {
      const registros =
        (await Tabela_Item.count({
          where: filtros,
        })) | 0;

      const itens = await Tabela_Item.findMany(query);

      const maximo_paginas =
        registros > 0 ? 1 + Math.floor(registros / limite) : 0;

      res.status(200).send({
        pagina,
        maximo_paginas,
        registros,
        limite,
        resultado: itens,
      });
    } catch (err) {
      next(err);
    }
  };
  create: RequestHandler = async (req, res, next) => {
    const usuario = req.user!;

    const {
      nome,
      unidade_id,
      desconto_porcentagem,
      valor_atual,
      imagem_url,
    }: Item = req.body;

    const validade_desconto: Date | undefined = req.body.validade_desconto
      ? new Date(req.body.validade_desconto)
      : undefined;

    try {
      validar_item(
        {
          nome,
          unidade_id,
          desconto_porcentagem,
          validade_desconto,
          valor_atual,
          imagem_url,
        },
        true
      );

      const item = await Tabela_Item.create({
        data: {
          nome,
          unidade_id,
          desconto_porcentagem,
          validade_desconto,
          valor_atual,
          estoque: {
            create: {},
          },
          alteracoes: {
            create: {
              valor_posterior: valor_atual || 0,
              desconto_posterior: 0,
              usuario_id: usuario.id,
              data: new Date(),
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
            mensagem: "Não foi possível salvar o item",
          } as Erro;
        });

      res.status(201).send(item);
    } catch (err) {
      next(err);
    }
  };
  update_by_id: RequestHandler = async (req, res, next) => {
    const usuario = req.user!;
    const id = Number(req.params.id);
    const metodo = req.method as Metodo;

    const {
      nome,
      unidade_id,
      desconto_porcentagem,
      valor_atual,
      imagem_url,
    }: Item = req.body;

    const validade_desconto: Date | undefined = req.body.validade_desconto
      ? new Date(req.body.validade_desconto)
      : undefined;

    let item_novo: any = undefined;

    try {
      validar_id(id);
      const item_antigo = await Tabela_Item.findFirst({ where: { id } });

      if (metodo == "PATCH") {
        validar_item({
          nome,
          unidade_id,
          desconto_porcentagem,
          id,
          validade_desconto,
          valor_atual,
        });

        item_novo = await Tabela_Item.update({
          where: {
            id,
          },
          data: {
            nome,
            desconto_porcentagem,
            valor_atual,
            unidade_id,
            validade_desconto,
            imagem_url,
            estoque: {
              connectOrCreate: {
                create: {},
                where: {
                  item_id: id,
                },
              },
            },
            alteracoes: {
              create: {
                desconto_anterior: item_antigo?.desconto_porcentagem,
                desconto_posterior: desconto_porcentagem || 0,
                validade_desconto: validade_desconto,
                valor_anterior: item_antigo?.valor_atual,
                valor_posterior: valor_atual || item_antigo?.valor_atual || 0,
                data: new Date(),
                usuario_id: usuario.id,
              },
            },
          },
          select: this.selecionar_campos(true),
        })
          .then((res) => res)
          .catch((err) => {
            const { codigo, erro } = verificar_erro_prisma(err);

            throw {
              mensagem: "Não foi possível atualizar o item",
              codigo,
              erro,
            } as Erro;
          });
      } else if (metodo == "PUT") {
        validar_item(
          {
            nome,
            unidade_id,
            desconto_porcentagem,
            id,
            validade_desconto,
            valor_atual,
          },
          true
        );

        item_novo = await Tabela_Item.upsert({
          where: { id },
          create: {
            nome,
            desconto_porcentagem,
            imagem_url,
            unidade_id,
            validade_desconto,
            valor_atual,
            id,
            estoque: {
              create: {},
            },
            alteracoes: {
              create: {
                valor_posterior: valor_atual || 0,
                data: new Date(),
                desconto_posterior: desconto_porcentagem || 0,
                usuario_id: usuario.id,
              },
            },
          },
          update: {
            desconto_porcentagem,
            imagem_url,
            nome,
            unidade_id,
            validade_desconto,
            valor_atual,
            estoque: {
              connectOrCreate: {
                create: {},
                where: {
                  item_id: id,
                },
              },
            },
            alteracoes: {
              create: {
                desconto_anterior: item_antigo?.desconto_porcentagem,
                desconto_posterior: desconto_porcentagem || 0,
                validade_desconto: validade_desconto,
                valor_anterior: item_antigo?.valor_atual,
                valor_posterior: valor_atual || item_antigo?.valor_atual || 0,
                data: new Date(),
                usuario_id: usuario.id,
              },
            },
          },
          select: this.selecionar_campos(true),
        })
          .then((res) => res)
          .catch((err) => {
            const { codigo, erro } = verificar_erro_prisma(err);

            throw {
              mensagem: "Não foi possível salvar o item",
              codigo,
              erro,
            } as Erro;
          });
      }

      res.status(item_antigo ? 200 : 201).send(item_novo);
    } catch (err) {
      next(err);
    }
  };
  remove_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);
      await Tabela_Item.delete({
        where: { id },
      })
        .then()
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            mensagem: "Não foi possível remover o item",
            codigo,
            erro,
          } as Erro;
        });
    } catch (err) {
      next(err);
    }
  };

  upload_image: RequestHandler = async (req, res, next) => {
    const item_id = Number(req.params.id);

    const file = req.file!;
    const file_path = req.file_path!;

    try {
      validar_id(item_id);

      const item_antigo = await Tabela_Item.findFirst({
        where: {
          id: item_id,
        },
        select: { imagem_url: true },
      });

      if (!item_antigo) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum item",
          mensagem: "Não foi possível salvar a imagem",
        } as Erro;
      }

      const item_novo = await Tabela_Item.update({
        where: {
          id: item_id,
        },
        data: {
          imagem_url: `${API_URL}/itens/imagens/${file.name}`,
        },
        select: {
          id: true,
          nome: true,
          imagem_url: true,
        },
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível salvar a imagem",
          } as Erro;
        });

      if (item_antigo.imagem_url) {
        const caminho_relativo = path.resolve("./files/item");
        const caminho_completo = path.join(
          caminho_relativo,
          item_antigo.imagem_url
        );

        fs.rm(caminho_completo, (err) => {
          if (err) {
          }
        });
      }

      file.mv(file_path);

      res.status(200).send(item_novo);
    } catch (err) {
      next(err);
    }
  };
  remove_image: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);

      const item_antigo = await Tabela_Item.findFirst({
        where: { id },
        select: { imagem_url: true },
      });

      if (!item_antigo) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum item",
          mensagem: "Não foi possível remover a imagem",
        } as Erro;
      }

      const { imagem_url } = item_antigo;

      if (!imagem_url) {
        throw {
          codigo: 404,
          erro: "O item informado não possui uma imagem",
          mensagem: "Não foi possível remover a imagem",
        } as Erro;
      }

      const nome_imagem = imagem_url.split("/").at(-1)!;
      const caminho_relativo = path.resolve("./files/itens");
      const caminho_completo = path.join(caminho_relativo, nome_imagem);

      fs.rm(caminho_completo, async (err) => {
        if (!err) {
          await Tabela_Item.update({
            where: { id },
            data: { imagem_url: { set: null } },
          });

          res.status(204).send();
        } else {
          res.status(404).send({
            mensagem: "Não foi possível remover a imagem",
            erro: "O item informado não possui uma imagem",
          });
        }
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
    const selecionados: Prisma.ItemSelect = {
      id: true,
      nome: true,
      valor_atual: true,
      desconto_porcentagem: true,
      validade_desconto: true,
      imagem_url: true,
      unidade: {
        select: {
          nome: true,
        },
      },
      alteracoes: exibir_alteracoes
        ? {
            orderBy: {
              data: "desc",
            },
            select: {
              data: true,
              valor_anterior: true,
              valor_posterior: true,
              desconto_anterior: true,
              desconto_posterior: true,
              validade_desconto: true,
              usuario: {
                select: {
                  id: true,
                  nome_usuario: true,
                  email: true,
                },
              },
            },
            skip: (pagina_alteracoes - 1) * limite_alteracoes,
            take: limite_alteracoes,
          }
        : false,
    };

    return selecionados;
  }
}
