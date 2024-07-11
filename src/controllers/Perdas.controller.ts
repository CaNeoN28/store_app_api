import { RequestHandler } from "express";
import Controller from "./Controller";
import { Erro, Perda } from "../types";
import {
  Tabela_Estoque,
  Tabela_Item,
  Tabela_Perda,
  Tabela_Perda_Item,
} from "../db/tabelas";
import { Prisma } from "@prisma/client";
import validar_perda from "../utils/validacao/validar_perda";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import definir_query from "../utils/definir_query";
import ordenar_documentos from "../utils/ordenar_documentos";
import { validar_id } from "../utils/validacao";
import {
  extrair_intervalo,
  extrair_paginacao,
} from "../utils/extracao_request";

interface Intervalo_Data {
  data_minima?: string;
  data_maxima?: string;
}

interface Resumo_Item {
  id: number;
  nome: string;
  quantidade_perda: number;
}

export default class Controller_Perdas extends Controller {
  list: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const { nome_item } = req.query;
    const filtros: Prisma.PerdaWhereInput = {};

    if (nome_item) {
      filtros.perda_item = {
        some: {
          item: {
            nome: {
              contains: String(nome_item),
              mode: "insensitive",
            },
          },
        },
      };
    }

    const filtro_data = extrair_intervalo(req);

    if (filtro_data) {
      filtros.data = filtro_data;
    }

    const query = definir_query(
      filtros,
      ordenar_documentos("-data", Tabela_Perda),
      this.selecionar_campos(),
      limite,
      pagina
    );

    try {
      const registros = await Tabela_Perda.count({ where: filtros });

      const maximo_paginas = Math.ceil(registros / limite);

      const perdas = await Tabela_Perda.findMany(query)
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível listar perdas",
          } as Erro;
        });

      res.status(200).send({
        resultado: perdas,
        pagina,
        maximo_paginas,
        limite,
        registros,
      });
    } catch (err) {
      next(err);
    }
  };
  list_item: RequestHandler = async (req, res, next) => {
    const item_id = Number(req.params.id);
    const { limite, pagina } = extrair_paginacao(req);

    const filtros_perdas: Prisma.PerdaWhereInput = {
      perda_item: {
        some: {
          item_id,
        },
      },
    };

    try {
      validar_id(item_id);

      const item = await Tabela_Item.findFirst({
        where: { id: item_id },
        select: { nome: true },
      });

      if (!item) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum item",
          mensagem: "Não foi possível recuperar as perdas do item",
        } as Erro;
      }

      const resumo_perdas = await Tabela_Perda.aggregate({
        where: { perda_item: { some: { item_id } } },

        _max: { data: true },
        _min: { data: true },
      });

      const {
        _max: { data: data_mais_recente },
        _min: { data: data_mais_antiga },
      } = resumo_perdas;

      const perdas = await Tabela_Perda.findMany({
        where: filtros_perdas,
        skip: (pagina - 1) * limite,
        take: limite,
        select: {
          id: true,
          data: true,
          perda_item: {
            where: { item_id },
            select: { quantidade: true },
          },
        },
      });

      const registros = await Tabela_Perda.count({
        where: filtros_perdas,
      });

      const maximo_paginas = Math.ceil(registros / limite);

      res.status(200).send({
        id: item_id,
        nome: item.nome,
        perdas: {
          data_mais_antiga,
          data_mais_recente,
          pagina,
          maximo_paginas,
          limite,
          registros,
          resultado: perdas,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  resumo: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const filtros: Prisma.Perda_ItemWhereInput = {};

    const { nome_item } = req.query;

    if (nome_item) {
      filtros.item = {
        nome: {
          contains: String(nome_item),
          mode: "insensitive",
        },
      };
    }

    const filtro_data = extrair_intervalo(req);

    if (filtro_data) {
      filtros.perda = {
        data: filtro_data,
      };
    }

    try {
      const registros = (
        await Tabela_Perda_Item.groupBy({
          by: "item_id",
          where: filtros,
        })
      ).length;

      const maximo_paginas = Math.ceil(registros / limite);

      const perdas_item = await Tabela_Perda_Item.groupBy({
        by: "item_id",
        orderBy: {
          item_id: "asc",
        },
        _sum: { quantidade: true },
        where: filtros,
        skip: (pagina - 1) * limite,
        take: limite,
      });

      const resumo_item: Resumo_Item[] = [];

      for (const perda of perdas_item) {
        const { item_id, _sum } = perda;

        const item = await Tabela_Item.findFirst({
          where: {
            id: item_id,
          },
          select: {
            nome: true,
          },
        });

        if (item) {
          const { nome } = item;

          resumo_item.push({
            id: item_id,
            nome,
            quantidade_perda: Number(_sum.quantidade),
          });
        }
      }

      const resumo_perda = await Tabela_Perda.aggregate({
        where: {
          perda_item: {
            some: {
              item_id: {
                in: resumo_item.map((i) => i.id),
              },
            },
          },
          data: filtros.perda?.data,
        },
        _min: {
          data: true,
        },
        _max: {
          data: true,
        },
      });

      const {
        _max: { data: data_mais_recente },
        _min: { data: data_mais_antiga },
      } = resumo_perda;

      res.status(200).send({
        data_mais_antiga,
        data_mais_recente,
        resumo_itens: {
          resultado: resumo_item,
          pagina,
          maximo_paginas,
          limite,
          registros,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  resumo_item: RequestHandler = async (req, res, next) => {
    const item_id = Number(req.params.id);

    const filtros: Prisma.Perda_ItemWhereInput = {
      item_id,
    };

    const filtro_data = extrair_intervalo(req);

    if (filtro_data) {
      filtros.perda = {
        data: filtro_data,
      };
    }

    try {
      validar_id(item_id);

      const item = await Tabela_Item.findFirst({
        where: { id: item_id },
        select: { nome: true },
      });

      const {
        _sum: { quantidade: perda_total },
      } = await Tabela_Perda_Item.aggregate({
        where: filtros,
        _sum: {
          quantidade: true,
        },
      });

      const resumo_perda = await Tabela_Perda.aggregate({
        where: {
          perda_item: {
            some: {
              item_id,
            },
          },
          data: filtros.perda?.data,
        },
        _max: { data: true },
        _min: { data: true },
      });

      const {
        _max: { data: data_mais_recente },
        _min: { data: data_mais_antiga },
      } = resumo_perda;

      if (!item) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum item",
          mensagem: "Não foi possível recuperar as perdas do item",
        } as Erro;
      }

      res.status(200).send({
        id: item_id,
        nome: item.nome,
        perda_total,
        data_mais_antiga,
        data_mais_recente,
      });
    } catch (err) {
      next(err);
    }
  };
  create: RequestHandler = async (req, res, next) => {
    const { itens }: Perda = req.body;

    try {
      validar_perda({ itens });

      const estoques = await Tabela_Estoque.findMany({
        where: {
          item_id: {
            in: itens.map((i) => i.id),
          },
        },
      }).then((res) => {
        const estoques: { [k: number]: number } = {};

        res.map((e) => {
          estoques[e.item_id] = Number(e.quantidade);
        });

        return estoques;
      });

      const erros_estoque: { [k: string]: any } = {};

      for (const item of itens) {
        const { id, quantidade } = item;
        const estoque = estoques[id];

        if (!estoque) {
          erros_estoque[id] = "O estoque deste produto não está disponível";
        } else if (estoque < quantidade) {
          erros_estoque[id] =
            "Não há quantia o suficiente no estoque para realizar a operação";
        }
      }

      if (Object.keys(erros_estoque).length > 0) {
        throw {
          codigo: 400,
          erro: erros_estoque,
          mensagem: "Não foi possível criar perda",
        } as Erro;
      }

      const perdas = await Tabela_Perda.create({
        data: {
          perda_item: {
            create: itens.map((i) => {
              estoques[i.id] -= i.quantidade;
              return {
                item: {
                  connect: {
                    id: i.id,
                  },
                },
                quantidade: i.quantidade,
              };
            }),
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
            mensagem: "Não foi possível criar perda",
          } as Erro;
        });

      for (const k in estoques) {
        const estoque = estoques[k];

        await Tabela_Estoque.update({
          where: {
            item_id: Number(k),
          },
          data: {
            quantidade: estoque,
          },
        });
      }

      res.status(201).send(perdas);
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos() {
    const selecionados: Prisma.PerdaSelect = {
      id: true,
      data: true,
      perda_item: {
        orderBy: {
          item_id: "asc",
        },
        select: {
          quantidade: true,
          item: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
    };

    return selecionados;
  }
}
