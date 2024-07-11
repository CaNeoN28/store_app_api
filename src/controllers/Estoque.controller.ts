import { Prisma } from "@prisma/client";
import Controller from "./Controller";
import { RequestHandler } from "express";
import { Tabela_Alteracoes_Estoque, Tabela_Estoque, Tabela_Item } from "../db/tabelas";
import { Erro, Estoque, Metodo } from "../types";
import { validar_estoque, validar_id } from "../utils/validacao";
import { extrair_paginacao } from "../utils/extracao_request";

export default class Estoque_Controller extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    const item_id = Number(req.params.id);

    let limite_alteracoes = Number(req.query.limite_alteracoes),
      pagina_alteracoes = Number(req.query.pagina_alteracoes);

    if (isNaN(limite_alteracoes))
      limite_alteracoes = Controller.LIMITE_EXIBICAO_PADRAO;

    if (isNaN(pagina_alteracoes))
      pagina_alteracoes = Controller.PAGINA_EXIBICAO_PADRAO;

    try {
      validar_id(item_id);

      const registros = await Tabela_Alteracoes_Estoque.count({
        where: {
          estoque:{
            item_id
          },
        },
      });

      const maximo_paginas = Math.ceil(registros / limite_alteracoes);

      const item = await Tabela_Item.findFirst({
        where: {
          id: item_id,
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
          mensagem: "Não foi possível recuperar o estoque",
        } as Erro;
      }

      const { nome, id, estoque }: any = item;

      res.status(200).send({
        id,
        nome,
        estoque: {
          ...estoque,
          alteracoes_estoque: {
            resultado: estoque.alteracoes_estoque,
            pagina: pagina_alteracoes,
            maximo_paginas,
            limite: limite_alteracoes,
            registros,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  };
  update_by_id: RequestHandler = async (req, res, next) => {
    const { id: usuario_id } = req.user!;

    const item_id = Number(req.params.id);
    const metodo = req.method as Metodo;

    const { quantidade: quantidade_nova }: Estoque = req.body;

    try {
      validar_id(item_id);

      const estoque_antigo = await Tabela_Estoque.findFirst({
        where: {
          item_id,
        },
        select: {
          quantidade: true,
        },
      });
      let estoque_novo: any = undefined;

      if (metodo == "PATCH") {
        validar_estoque({ quantidade: quantidade_nova });

        estoque_novo = await Tabela_Item.update({
          where: {
            id: item_id,
          },
          select: this.selecionar_campos(true),
          data: {
            estoque: {
              update: {
                quantidade: quantidade_nova,
                alteracoes_estoque: {
                  create: {
                    usuario_id: usuario_id,
                    quantidade_anterior: estoque_antigo?.quantidade,
                    quantidade_atual:
                      quantidade_nova || estoque_antigo?.quantidade || 0,
                  },
                },
              },
            },
          },
        });
      } else if (metodo == "PUT") {
        validar_estoque({ quantidade: quantidade_nova }, true);

        estoque_novo = await Tabela_Item.update({
          where: {
            id: item_id,
          },
          data: {
            estoque: {
              upsert: {
                where: {
                  item_id: item_id,
                },
                create: {
                  quantidade: quantidade_nova,
                  alteracoes_estoque: {
                    create: {
                      usuario_id,
                      quantidade_atual: quantidade_nova,
                    },
                  },
                },
                update: {
                  quantidade: quantidade_nova,
                  alteracoes_estoque: {
                    create: {
                      usuario_id,
                      quantidade_atual: quantidade_nova,
                      quantidade_anterior: estoque_antigo?.quantidade,
                    },
                  },
                },
              },
            },
          },
          select: this.selecionar_campos(true),
        });
      }

      res.status(estoque_antigo ? 200 : 201).send(estoque_novo);
    } catch (err) {
      next(err);
    }
  };
  list: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);
    const { nome_item } = req.query;

    const filtros: Prisma.ItemWhereInput = {};

    if (nome_item) {
      filtros.nome = {
        contains: String(nome_item),
        mode: "insensitive",
      };
    }

    try {
      const registros = await Tabela_Item.count({
        where: filtros,
      });

      const maximo_paginas = Math.ceil(registros / limite);

      const estoque = await Tabela_Item.findMany({
        where: filtros,
        select: this.selecionar_campos(),
        skip: (pagina - 1) * limite,
        take: limite,
      }).then((res) => {
        return res.map((item) => {
          const { estoque, nome, id } = item;

          const quantidade = estoque ? estoque.quantidade.toFixed(2) : null;

          return {
            id,
            nome,
            quantidade,
          };
        });
      });

      res.status(200).send({
        resultado: estoque,
        pagina,
        maximo_paginas,
        limite,
        registros,
      });
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos(
    selecionar_alteracoes?: boolean,
    limite_alteracoes = Controller.LIMITE_EXIBICAO_PADRAO,
    pagina_alteracoes = Controller.PAGINA_EXIBICAO_PADRAO
  ) {
    const selecionados: Prisma.ItemSelect = {
      nome: true,
      id: true,
      estoque: {
        select: {
          quantidade: true,
          alteracoes_estoque: selecionar_alteracoes
            ? {
                take: limite_alteracoes,
                skip: (pagina_alteracoes - 1) * limite_alteracoes,
                orderBy: {
                  data: "desc",
                },
                select: {
                  data: true,
                  quantidade_anterior: true,
                  quantidade_atual: true,
                  usuario: {
                    select: {
                      id: true,
                      nome_usuario: true,
                      email: true,
                      numero_telefone: true,
                    },
                  },
                },
              }
            : false,
        },
      },
    };

    return selecionados;
  }
}
