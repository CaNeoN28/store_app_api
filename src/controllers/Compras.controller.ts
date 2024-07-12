import { RequestHandler } from "express";
import Controller from "./Controller";
import { Compra, Erro } from "../types";
import { validar_id } from "../utils/validacao";
import validar_compra from "../utils/validacao/validar_compra";
import {
  Tabela_Compra,
  Tabela_Compra_Item,
  Tabela_Estoque,
  Tabela_Item,
} from "../db/tabelas";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { Prisma } from "@prisma/client";
import definir_query from "../utils/definir_query";
import ordenar_documentos from "../utils/ordenar_documentos";
import {
  extrair_intervalo,
  extrair_paginacao,
} from "../utils/extracao_request";

interface Resumo_Item {
  nome: string;
  id: number;
  quantidade: number;
  valor_medio: number;
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
    const { limite, pagina } = extrair_paginacao(req);

    const filtros: Prisma.CompraWhereInput = {};

    const filtros_data = extrair_intervalo(req);

    if (filtros_data) {
      filtros.data = filtros_data;
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
        pagina,
        maximo_paginas,
        registros,
        limite,
        resultado: compras,
      });
    } catch (err) {
      next(err);
    }
  };
  list_fornecedor: RequestHandler = async (req, res, next) => {
    const fornecedor_id = Number(req.params.id);

    const { limite, pagina } = extrair_paginacao(req);

    const filtros: Prisma.CompraWhereInput = {};

    const filtros_data = extrair_intervalo(req);

    if (filtros_data) {
      filtros.data = filtros_data;
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
        pagina,
        maximo_paginas,
        registros,
        limite,
        resultado: compras,
      });
    } catch (err) {
      next(err);
    }
  };
  list_item: RequestHandler = async (req, res, next) => {
    const item_id = Number(req.params.id);

    const filtros_compra: Prisma.CompraWhereInput = {
      compra_item: {
        some: { item_id },
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
          erro: "O id informado não correspond a nenhum item",
          mensagem: "Não foi possível recuperar as compras do item",
        } as Erro;
      }

      const compras = await Tabela_Compra.findMany({
        where: filtros_compra,
      });

      res.status(200).send({
        id: item_id,
        nome: item.nome,
        compras: {
          resultado: compras,
        },
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

      for (const item of itens) {
        const quantidade_atual =
          Number(
            (
              await Tabela_Estoque.findFirst({
                where: {
                  item_id: item.item_id,
                },
                select: {
                  quantidade: true,
                },
              })
            )?.quantidade
          ) || 0;

        await Tabela_Estoque.update({
          where: {
            item_id: item.item_id,
          },
          data: {
            quantidade: quantidade_atual + item.quantidade,
          },
        });
      }

      res.status(201).send(compra);
    } catch (err) {
      next(err);
    }
  };

  resumo: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const { nome_item } = req.query;
    const filtros: Prisma.Compra_ItemWhereInput = {};

    const filtros_data = extrair_intervalo(req);

    if (nome_item) {
      filtros.item = {
        nome: {
          contains: String(nome_item),
          mode: "insensitive",
        },
      };
    }

    if (filtros_data) {
      filtros.compra = {
        data: filtros_data,
      };
    }

    try {
      const compra_itens = await Tabela_Compra_Item.groupBy({
        by: "item_id",
        orderBy: {
          item_id: "asc",
        },
        where: filtros,
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

      const numero_itens = (
        await Tabela_Compra_Item.groupBy({
          by: "item_id",
          where: filtros,
        })
      ).length;

      const maximo_paginas =
        numero_itens > 0 ? Math.floor(numero_itens / limite) + 1 : 0;

      const resumo_itens: Resumo_Item[] = [];

      for (const compra of compra_itens) {
        const item = await Tabela_Compra_Item.findMany({
          where: {
            item_id: compra.item_id,
          },
          select: {
            quantidade: true,
            valor_combinado: true,
            item: {
              select: {
                nome: true,
              },
            },
          },
        }).then((res) => {
          return res
            .map((venda) => {
              const { item, quantidade, valor_combinado } = venda;

              return {
                nome_item: item.nome,
                quantidade: Number(quantidade),
                valor_venda: Number(quantidade),
                total: Number(quantidade) * Number(valor_combinado),
              };
            })
            .reduce((prev, curr) => {
              return {
                ...prev,
                quantidade: prev.quantidade + curr.quantidade,
                total: prev.total + curr.total,
              };
            });
        });

        if (item) {
          const valor = Number(compra._avg.valor_combinado?.toFixed(2));
          const quantidade = item.quantidade;
          const total = item.total;

          resumo_itens.push({
            id: compra.item_id,
            nome: item.nome_item,
            numero_compras: compra._count.compra_id,
            quantidade,
            valor_medio: valor,
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
          data: filtros_data,
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

      const total =
        resumo_itens.length > 0
          ? resumo_itens.reduce((prev, curr) => ({
              ...prev,
              total: prev.total + curr.total,
            })).total
          : 0;

      res.status(200).send({
        data_mais_antiga,
        data_mais_recente,
        total,
        resumo_itens: {
          itens: resumo_itens,
          pagina,
          maximo_paginas,
          limite,
          registros: numero_itens,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  resumo_fornecedor: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const fornecedor_id = Number(req.params.id);
    const { nome_item } = req.query;
    const filtros_data = extrair_intervalo(req);

    const filtros: Prisma.Compra_ItemWhereInput = {
      compra: {
        fornecedor_id,
      },
    };

    if (nome_item) {
      filtros.item = {
        nome: {
          contains: String(nome_item),
          mode: "insensitive",
        },
      };
    }

    if (filtros_data) {
      filtros.compra!.data = filtros_data;
    }

    try {
      validar_id(fornecedor_id);

      const compra_itens = await Tabela_Compra_Item.groupBy({
        by: "item_id",
        orderBy: {
          item_id: "asc",
        },
        where: filtros,
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

      const numero_itens = (
        await Tabela_Compra_Item.groupBy({
          by: "item_id",
          where: filtros,
        })
      ).length;

      const maximo_paginas =
        numero_itens > 0 ? Math.floor(numero_itens / limite) + 1 : 0;

      const resumo_itens: Resumo_Item[] = [];

      for (const compra of compra_itens) {
        const item = await Tabela_Compra_Item.findMany({
          where: {
            item_id: compra.item_id,
          },
          select: {
            quantidade: true,
            valor_combinado: true,
            item: {
              select: {
                nome: true,
              },
            },
          },
        }).then((res) => {
          return res
            .map((venda) => {
              const { item, quantidade, valor_combinado } = venda;

              return {
                nome_item: item.nome,
                quantidade: Number(quantidade),
                valor_venda: Number(quantidade),
                total: Number(quantidade) * Number(valor_combinado),
              };
            })
            .reduce((prev, curr) => {
              return {
                ...prev,
                quantidade: prev.quantidade + curr.quantidade,
                total: prev.total + curr.total,
              };
            });
        });

        if (item) {
          const valor = Number(compra._avg.valor_combinado?.toFixed(2));
          const quantidade = item.quantidade;
          const total = item.total;

          resumo_itens.push({
            id: compra.item_id,
            nome: item.nome_item,
            numero_compras: compra._count.compra_id,
            quantidade,
            valor_medio: valor,
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
          data: filtros_data,
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

      const total =
        resumo_itens.length > 0
          ? resumo_itens.reduce((prev, curr) => ({
              ...prev,
              total: prev.total + curr.total,
            })).total
          : 0;

      res.status(200).send({
        data_mais_antiga,
        data_mais_recente,
        total,
        resumo_itens: {
          itens: resumo_itens,
          pagina,
          maximo_paginas,
          limite,
          registros: numero_itens,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  resumo_item: RequestHandler = async (req, res, next) => {};

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
