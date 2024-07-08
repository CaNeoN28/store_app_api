import { RequestHandler } from "express";
import Controller from "./Controller";
import { Compra, Erro } from "../types";
import { validar_id } from "../utils/validacao";
import validar_compra from "../utils/validacao/validar_compra";
import { Tabela_Compra, Tabela_Compra_Item, Tabela_Item } from "../db/tabelas";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Prisma } from "@prisma/client";
import definir_query from "../utils/definir_query";
import ordenar_documentos from "../utils/ordenar_documentos";
import extrair_paginacao from "../utils/extrair_paginacao";

interface Resumo_Item {
  nome: string;
  id: number;
  quantidade: number;
  valor: number;
  numero_compras: number;
  total: number;
}

export default class Controller_Compras extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);

      const compra = await Tabela_Compra.findFirst({
        where: { id },
        select: this.selecionar_campos(true, true),
      });

      if (!compra) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhuma compra",
          mensagem: "Não foi possível recuperar compra",
        } as Erro;
      }

      res.status(200).send(compra);
    } catch (err) {
      next(err);
    }
  };
  list: RequestHandler = async (req, res, next) => {
    let limite = Number(req.query.limite),
      pagina = Number(req.query.pagina);

    if (isNaN(limite)) limite = Controller.LIMITE_EXIBICAO_PADRAO;
    if (isNaN(pagina)) pagina = Controller.PAGINA_EXIBICAO_PADRAO;

    const {
      data_minima,
      data_maxima,
    }: { data_minima?: string; data_maxima?: string } = req.query;
    const filtros: Prisma.CompraWhereInput = {};

    if (data_minima || data_maxima) {
      filtros.data = {};

      if (data_minima && !isNaN(Number(new Date(data_minima)))) {
        filtros.data.gte = new Date(data_minima);
      }

      if (data_maxima && !isNaN(Number(new Date(data_maxima)))) {
        filtros.data.lte = new Date(data_maxima);
      }
    }

    try {
      const registros = await Tabela_Compra.count({ where: filtros });

      const maximo_paginas =
        registros > 0 ? Math.floor(registros / limite) + 1 : 0;

      const query = definir_query(
        filtros,
        ordenar_documentos("-data", Tabela_Compra),
        this.selecionar_campos(true),
        limite,
        pagina
      );

      const compras = await Tabela_Compra.findMany(query);

      res.status(200).send({
        resultado: compras,
        pagina,
        maximo_paginas,
        registros,
        limite,
      });
    } catch (err) {
      next(err);
    }
  };
  resumo: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const nome_item = String(req.query.nome_item);

    const compra_itens = await Tabela_Compra_Item.groupBy({
      by: "item_id",
      orderBy: {
        item_id: "asc",
      },
      where: {
        item: {
          nome: {
            contains: nome_item,
          },
        },
      },
      take: limite,
      skip: (pagina - 1) * limite,
      _avg: { valor_combinado: true },
      _sum: { quantidade: true },
      _count: { compra_id: true },
    }).then((res) => {
      return res.map((i) => {
        return {
          ...i,
          total: Number(i._sum.quantidade) * Number(i._avg.valor_combinado),
        };
      });
    });

    const resumo_itens: Resumo_Item[] = [];

    for (const compra of compra_itens) {
      const item = await Tabela_Item.findFirst({
        where: { id: compra.item_id },
        select: {
          nome: true,
        },
      });

      if (item) {
        const quantidade = Number(compra._sum.quantidade);
        const valor = Number(compra._avg.valor_combinado);

        const total = quantidade * valor;

        resumo_itens.push({
          id: compra.item_id,
          nome: item.nome,
          numero_compras: compra._count.compra_id,
          quantidade,
          valor,
          total,
        });
      }
    }

    const resumo_compras = await Tabela_Compra.aggregate({
      where: {
        compra_item: {
          some: {
            item_id: {
              in: resumo_itens.map((i) => i.id),
            },
          },
        },
      },
      _min: {
        data: true,
      },
      _max: {
        data: true,
      },
    });

    const data_mais_antiga = resumo_compras._min.data,
      data_mais_recente = resumo_compras._max.data;

    const total = resumo_itens.reduce((prev, curr) => ({
      ...prev,
      total: prev.total + curr.total,
    })).total;

    res.status(200).send({
      data_mais_antiga,
      data_mais_recente,
      total,
      resumo_itens,
    });
  };
  list_fornecedor: RequestHandler = async (req, res, next) => {
    const fornecedor_id = Number(req.params.fornecedor_id);

    let limite = Number(req.query.limite),
      pagina = Number(req.query.pagina);

    if (isNaN(limite)) limite = Controller.LIMITE_EXIBICAO_PADRAO;
    if (isNaN(pagina)) pagina = Controller.PAGINA_EXIBICAO_PADRAO;

    const {
      data_minima,
      data_maxima,
    }: { data_minima?: string; data_maxima?: string } = req.query;
    const filtros: Prisma.CompraWhereInput = {};

    if (data_minima || data_maxima) {
      filtros.data = {};

      if (data_minima && !isNaN(Number(new Date(data_minima)))) {
        filtros.data.gte = new Date(data_minima);
      }

      if (data_maxima && !isNaN(Number(new Date(data_maxima)))) {
        filtros.data.lte = new Date(data_maxima);
      }
    }

    try {
      validar_id(fornecedor_id);

      const registros = await Tabela_Compra.count({
        where: { fornecedor_id, ...filtros },
      });

      const maximo_paginas =
        registros > 0 ? Math.floor(registros / limite) + 1 : 0;

      const query = definir_query(
        { fornecedor_id, ...filtros },
        ordenar_documentos("-data", Tabela_Compra),
        this.selecionar_campos(),
        limite,
        pagina
      );

      const compras = await Tabela_Compra.findMany(query);

      res.status(200).send({
        resultado: compras,
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
    const { fornecedor_id, itens }: Compra = req.body;
    try {
      validar_compra({ fornecedor_id, itens });

      const valor_total =
        itens.length > 0
          ? itens
              .map((item) => {
                const valor = item.quantidade * item.valor_combinado;

                return valor;
              })
              .reduce((prev, curr) => {
                return prev + curr;
              })
          : 0;

      const compra = await Tabela_Compra.create({
        data: {
          valor_total,
          fornecedor_id,
          compra_item: {
            create: itens.map((item) => ({
              item_id: item.item_id,
              quantidade: item.quantidade,
              valor_combinado: item.valor_combinado,
            })),
          },
        },
        select: this.selecionar_campos(true, true),
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível cadastrar a compra",
          } as Erro;
        });

      res.status(201).send(compra);
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos(
    mostrar_fornecedor?: boolean,
    mostrar_itens?: boolean
  ) {
    const selecionados: Prisma.CompraSelect = {
      id: true,
      data: true,
      valor_total: true,
      fornecedor: mostrar_fornecedor
        ? {
            select: {
              id: true,
              cnpj: true,
              nome: true,
            },
          }
        : false,
      compra_item: mostrar_itens
        ? {
            select: {
              quantidade: true,
              valor_combinado: true,
              item: {
                select: {
                  id: true,
                  nome: true,
                  imagem_url: true,
                  unidade: { select: { nome: true } },
                },
              },
            },
          }
        : false,
    };

    return selecionados;
  }
}
