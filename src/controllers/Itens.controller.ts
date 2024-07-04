import { RequestHandler } from "express";
import Controller from "./Controller";
import { Prisma } from "@prisma/client";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { DefaultArgs } from "@prisma/client/runtime/library";
import { Item, Erro, Metodo } from "../types";
import { validar_id, validar_item } from "../utils/validacao";

export default class Controller_Itens extends Controller {
  tabela: Prisma.ItemDelegate<DefaultArgs>;
  protected selecionados: Prisma.ItemSelect;

  constructor() {
    super("item");

    this.tabela = Controller.delegar_tabela(
      "item"
    ) as Prisma.ItemDelegate<DefaultArgs>;

    this.selecionados = {};
    this.selecionar_todos_os_campos();
    this.selecionados.unidade = {
      select: {
        id: true,
        nome: true,
      },
    };
    this.selecionados.unidade_id = false;
  }

  get_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id;
      const item = await this.tabela
        .findFirst({
          where: {
            id,
          },
          select: this.selecionados,
        })
        .then((res) => res)
        .catch(() => {
          throw {
            codigo: 404,
            erro: "O id informado não corresponde a nenhum item",
            mensagem: "Não foi possível recuperar o item",
          } as Erro;
        });

      res.status(200).send(item);
    } catch (err) {
      next(err);
    }
  };
  list: RequestHandler = async (req, res, next) => {
    const { nome, em_desconto, ordenar } = req.query;
    let limite = Number(req.query.limite),
      pagina = Number(req.query.pagina);

    if (isNaN(pagina)) {
      pagina = Controller.PAGINA_EXIBICAO_PADRAO;
    }
    if (isNaN(limite)) {
      limite = Controller.LIMITE_EXIBICAO_PADRAO;
    }

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

    const ordenacao = this.formatar_ordenacao(
      ordenar
    ) as Prisma.ItemOrderByWithRelationInput;

    const query = Controller.definir_query(
      filtros,
      ordenacao,
      this.selecionados,
      limite,
      pagina
    );

    try {
      const registros =
        (await this.tabela.count({
          where: filtros,
        })) | 0;

      const itens = await this.tabela.findMany(query);

      const maximo_paginas =
        registros > 0 ? 1 + Math.floor(registros / limite) : 0;

      res.status(200).send({
        resultado: itens,
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

      const item = await this.tabela
        .create({
          data: {
            nome,
            unidade_id,
            desconto_porcentagem,
            validade_desconto,
            valor_atual,
            alteracoes: {
              create: {
                valor_posterior: valor_atual || 0,
                desconto_posterior: 0,
                usuario_id: usuario.id,
                data: new Date(),
              },
            },
          },
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

    let item: any = undefined;

    try {
      validar_id(id);
      const item_antigo = await this.tabela.findFirst({ where: { id } });

      if (metodo == "PATCH") {
        validar_item({
          nome,
          unidade_id,
          desconto_porcentagem,
          id,
          validade_desconto,
          valor_atual,
        });

        item = await this.tabela
          .update({
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
            select: this.selecionados,
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

        item = await this.tabela
          .upsert({
            where: { id },
            create: {
              nome,
              desconto_porcentagem,
              imagem_url,
              unidade_id,
              validade_desconto,
              valor_atual,
              id,
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

      res.status(200).send(item);
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
}
