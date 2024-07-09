import { RequestHandler } from "express";
import Controller from "./Controller";
import { Erro, Venda } from "../types";
import { Tabela_Item, Tabela_Venda, Tabela_Venda_Item } from "../db/tabelas";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import validar_venda from "../utils/validacao/validar_venda";
import { Prisma } from "@prisma/client";
import extrair_paginacao from "../utils/extrair_paginacao";
import { validar_id } from "../utils/validacao";

interface Intervalo_Data {
  data_minima?: string;
  data_maxima?: string;
}

interface Resumo_Item {
  nome: string;
  id: number;
  quantidade: number;
  valor: number;
  numero_vendas: number;
  total: number;
}

export default class Controller_Vendas extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);

      const venda = await Tabela_Venda.findFirst({
        where: { id },
        select: this.selecionar_campos(true, true),
      });

      if (!venda) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhuma venda",
          mensagem: "Não foi possível recuperar venda",
        } as Erro;
      }

      res.status(200).send(venda);
    } catch (err) {
      next(err);
    }
  };
  list: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);
    const { cliente_valido } = req.query;
    const { data_minima, data_maxima }: Intervalo_Data = req.query;

    const filtros: Prisma.VendaWhereInput = {};

    if (cliente_valido) {
      if (cliente_valido == "true")
        filtros.cliente = {
          isNot: null,
        };
      else if (cliente_valido == "false") {
        filtros.cliente = {
          is: null,
        };
      }
    }

    if (data_minima || data_maxima) {
      const data_minima_formatada = data_minima && new Date(data_minima);
      const data_maxima_formatada = data_maxima && new Date(data_maxima);
      filtros.data = {};

      if (data_minima && !isNaN(Number(data_minima_formatada))) {
        filtros.data.gte = data_minima_formatada;
      }

      if (data_maxima && !isNaN(Number(data_maxima_formatada))) {
        filtros.data.lte = data_maxima_formatada;
      }
    }

    try {
      const registros = await Tabela_Venda.count({
        where: filtros,
      });
      const maximo_paginas = registros > 0 ? Math.ceil(registros / limite) : 0;

      const itens = await Tabela_Venda.findMany({
        where: filtros,
        select: this.selecionar_campos(true),
        orderBy: { data: "desc" },
        skip: (pagina - 1) * limite,
        take: limite,
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível listar as vendas",
          } as Erro;
        });

      res.status(200).send({
        resultado: itens,
        pagina,
        maximo_paginas,
        limite,
        registros,
      });
    } catch (err) {
      next(err);
    }
  };
  list_cliente: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const cliente_id = Number(req.params.cliente_id);

    const filtros: Prisma.VendaWhereInput = {
      cliente_id,
    };

    try {
      validar_id(cliente_id);

      const registros = await Tabela_Venda.count({
        where: filtros,
      });

      const maximo_paginas = registros > 0 ? Math.ceil(registros / limite) : 0;

      const vendas = await Tabela_Venda.findMany({
        where: filtros,
        select: this.selecionar_campos(),
        skip: (pagina - 1) * limite,
        take: limite,
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível listar vendas",
          } as Erro;
        });

      res.status(200).send({
        resultado: vendas,
        pagina,
        maximo_paginas,
        limite,
        registros,
      });
    } catch (err) {
      next(err);
    }
  };
  create: RequestHandler = async (req, res, next) => {
    const { itens, cliente_id }: Venda = req.body;

    try {
      validar_venda({ itens, cliente_id });

      const valor_total = itens
        .map((i) => i.quantidade * i.valor_combinado)
        .reduce((prev, curr) => prev + curr);

      const venda = await Tabela_Venda.create({
        data: {
          cliente_id,
          venda_item: {
            create: itens.map((i) => {
              const { item_id, quantidade, valor_combinado } = i;

              return {
                item_id,
                quantidade,
                valor_venda: valor_combinado,
              };
            }),
          },
          valor_total,
        },
        select: this.selecionar_campos(true, true),
      })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);

          throw {
            codigo,
            erro,
            mensagem: "Não foi possível criar a venda",
          } as Erro;
        });

      res.status(201).send(venda);
    } catch (err) {
      next(err);
    }
  };

  resumo: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const { nome_item } = req.query;
    const filtros: Prisma.Venda_ItemWhereInput = {};

    if (nome_item) {
      filtros.item = {
        nome: {
          contains: String(nome_item),
          mode: "insensitive",
        },
      };
    }

    try {
      const venda_itens = await Tabela_Venda_Item.groupBy({
        by: "item_id",
        orderBy: {
          item_id: "asc",
        },
        where: filtros,
        skip: (pagina - 1) * limite,
        take: limite,
        _avg: { valor_venda: true },
        _sum: { quantidade: true },
        _count: { venda_id: true },
      });

      const registros = (
        await Tabela_Venda_Item.groupBy({
          by: "item_id",
          where: filtros,
        })
      ).length;

      const maximo_paginas = registros > 0 ? Math.ceil(registros / limite) : 0;

      const resumo_itens: Resumo_Item[] = [];

      for (const venda_resumo of venda_itens) {
        const vendas_item = await Tabela_Venda_Item.findMany({
          where: {
            item_id: venda_resumo.item_id,
          },
          select: {
            quantidade: true,
            valor_venda: true,
            item: {
              select: {
                nome: true,
              },
            },
          },
        }).then((res) => {
          return res
            .map((venda) => {
              const { item, quantidade, valor_venda } = venda;

              return {
                nome_item: item.nome,
                quantidade: Number(quantidade),
                valor_venda: Number(valor_venda),
                total: Number(quantidade) * Number(valor_venda),
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

        if (vendas_item) {
          const quantidade = vendas_item.quantidade;
          const total = vendas_item.total;
          const valor = Number(venda_resumo._avg.valor_venda?.toFixed(2));

          resumo_itens.push({
            id: venda_resumo.item_id,
            nome: vendas_item.nome_item,
            numero_vendas: venda_resumo._count.venda_id,
            quantidade,
            total,
            valor,
          });
        }
      }

      const resumo_vendas = await Tabela_Venda.aggregate({
        where: {
          venda_item: {
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

      const data_mais_antiga = resumo_vendas._min.data,
        data_mais_recente = resumo_vendas._min.data;

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
          resultado: resumo_itens,
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

  protected selecionar_campos(
    mostrar_cliente?: boolean,
    mostrar_itens?: boolean
  ) {
    const selecionados: Prisma.VendaSelect = {
      id: true,
      data: true,
      valor_total: true,
      cliente: mostrar_cliente
        ? {
            select: {
              id: true,
              cnpj: true,
              nome: true,
            },
          }
        : false,
      venda_item: mostrar_itens
        ? {
            select: {
              quantidade: true,
              valor_venda: true,
              item: {
                select: {
                  id: true,
                  nome: true,
                  unidade: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          }
        : false,
    };

    return selecionados;
  }
}
