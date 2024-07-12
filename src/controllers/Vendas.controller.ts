import { RequestHandler } from "express";
import Controller from "./Controller";
import { Erro, Venda } from "../types";
import {
  Tabela_Estoque,
  Tabela_Item,
  Tabela_Venda,
  Tabela_Venda_Item,
} from "../db/tabelas";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import validar_venda from "../utils/validacao/validar_venda";
import { Prisma } from "@prisma/client";
import { validar_id } from "../utils/validacao";
import {
  extrair_intervalo,
  extrair_paginacao,
} from "../utils/extracao_request";

interface Resumo_Item {
  nome: string;
  id: number;
  quantidade: number;
  valor_medio: number;
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

    const filtro_data = extrair_intervalo(req);

    if (filtro_data) {
      filtros.data = filtro_data;
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
        pagina,
        maximo_paginas,
        limite,
        registros,
        resultado: itens,
      });
    } catch (err) {
      next(err);
    }
  };
  list_cliente: RequestHandler = async (req, res, next) => {
    const { limite, pagina } = extrair_paginacao(req);

    const cliente_id = Number(req.params.id);

    const filtros: Prisma.VendaWhereInput = {
      cliente_id,
    };

    const filtro_data = extrair_intervalo(req);

    if (filtro_data) {
      filtros.data = filtro_data;
    }

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
        pagina,
        maximo_paginas,
        limite,
        registros,
        resultado: vendas,
      });
    } catch (err) {
      next(err);
    }
  };
  list_item: RequestHandler = async (req, res, next) => {
    const item_id = Number(req.params.id);

    const { limite, pagina } = extrair_paginacao(req);
    const filtros_data = extrair_intervalo(req);

    const filtros_venda: Prisma.VendaWhereInput = {
      venda_item: {
        some: {
          item_id,
        },
      },
    };

    if (filtros_data) {
      filtros_venda.data = filtros_data;
    }

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
          mensagem: "Não foi possível recuperar as vendas do item",
        } as Erro;
      }

      const registros = await Tabela_Venda.count({
        where: filtros_venda,
      });

      const maximo_paginas = Math.ceil(registros / limite);

      const vendas = await Tabela_Venda.findMany({
        where: filtros_venda,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: {
          data: "desc",
        },
        select: {
          id: true,
          data: true,
          venda_item: {
            where: { item_id },
            select: { quantidade: true, valor_venda: true },
          },
        },
      }).then((res) => {
        return res.map((venda) => {
          const { id, data } = venda;
          const { quantidade, valor_venda } = venda.venda_item[0];

          return {
            id,
            data,
            quantidade,
            valor_venda,
          };
        });
      });

      const resumo_vendas = await Tabela_Venda.aggregate({
        where: filtros_venda,
        _max: { data: true },
        _min: { data: true },
      });

      const {
        _max: { data: data_mais_recente },
        _min: { data: data_mais_antiga },
      } = resumo_vendas;

      res.status(200).send({
        id: item_id,
        nome: item.nome,
        vendas: {
          pagina,
          maximo_paginas,
          limite,
          registros,
          data_mais_antiga,
          data_mais_recente,
          resultado: vendas,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  create: RequestHandler = async (req, res, next) => {
    const { itens, cliente_id }: Venda = req.body;

    try {
      validar_venda({ itens, cliente_id });

      const erros_estoque: { [k: string]: any } = {};
      const estoques: {
        [item_id: number]: { id: number; quantidade: number };
      } = {};

      for (const item of itens) {
        const estoque = await Tabela_Estoque.findFirst({
          where: {
            item_id: item.item_id,
          },
          select: {
            id: true,
            quantidade: true,
          },
        }).then((res) => {
          if (res) {
            return {
              id: res.id,
              quantidade: Number(res.quantidade),
            };
          } else {
            return undefined;
          }
        });

        if (!estoque || Number(estoque.quantidade) < item.quantidade) {
          erros_estoque[item.item_id] =
            "Não há o suficiente para realizar a venda do item";
        } else {
          estoques[item.item_id] = estoque;
        }
      }

      if (Object.keys(erros_estoque).length > 0) {
        throw {
          codigo: 400,
          erro: erros_estoque,
          mensagem: "Não foi possível realizar a compra",
        } as Erro;
      }

      const valor_total = itens
        .map((i) => i.quantidade * i.valor_combinado)
        .reduce((prev, curr) => prev + curr);

      const venda = await Tabela_Venda.create({
        data: {
          cliente_id,
          venda_item: {
            create: itens.map((i) => {
              const { item_id, quantidade, valor_combinado } = i;
              estoques[item_id].quantidade -= quantidade;

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

      for (const k in estoques) {
        const { id, quantidade } = estoques[k];

        await Tabela_Estoque.update({
          where: {
            id,
          },
          data: {
            quantidade,
          },
        });
      }

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

    const filtro_data = extrair_intervalo(req);

    if (filtro_data) {
      filtros.venda = {
        data: filtro_data,
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
              const total = Number(quantidade) * Number(valor_venda);

              return {
                nome_item: item.nome,
                quantidade: Number(quantidade),
                valor_venda: Number(valor_venda),
                total,
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
          const quantidade = Number(vendas_item.quantidade.toFixed(2));
          const total = Number(vendas_item.total.toFixed(2));
          const valor = Number(venda_resumo._avg.valor_venda?.toFixed(2));

          resumo_itens.push({
            id: venda_resumo.item_id,
            nome: vendas_item.nome_item,
            numero_vendas: venda_resumo._count.venda_id,
            quantidade,
            total,
            valor_medio: valor,
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
          data: filtros.venda?.data,
        },
        _min: {
          data: true,
        },
        _max: {
          data: true,
        },
      });

      const data_mais_antiga = resumo_vendas._min.data,
        data_mais_recente = resumo_vendas._max.data;

      const total =
        resumo_itens.length > 0
          ? resumo_itens
              .reduce((prev, curr) => ({
                ...prev,
                total: prev.total + curr.total,
              }))
              .total.toFixed(2)
          : 0;

      res.status(200).send({
        data_mais_antiga,
        data_mais_recente,
        total,
        resumo_itens: {
          pagina,
          maximo_paginas,
          limite,
          registros,
          resultado: resumo_itens,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  resumo_cliente: RequestHandler = async (req, res, next) => {
    const cliente_id = Number(req.params.id);
    const { limite, pagina } = extrair_paginacao(req);

    const { nome_item } = req.query;

    const filtros: Prisma.Venda_ItemWhereInput = {
      venda: {
        cliente_id,
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

    const filtro_data = extrair_intervalo(req);

    if (filtro_data) {
      filtros.venda!.data = filtro_data;
    }

    try {
      validar_id(cliente_id);
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
          const quantidade = Number(vendas_item.quantidade.toFixed(2));
          const total = Number(vendas_item.total.toFixed(2));
          const valor = Number(venda_resumo._avg.valor_venda?.toFixed(2));

          resumo_itens.push({
            id: venda_resumo.item_id,
            nome: vendas_item.nome_item,
            numero_vendas: venda_resumo._count.venda_id,
            quantidade,
            total,
            valor_medio: valor,
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
          data: filtro_data,
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
          ? resumo_itens
              .reduce((prev, curr) => ({
                ...prev,
                total: prev.total + curr.total,
              }))
              .total.toFixed(2)
          : 0;

      res.status(200).send({
        data_mais_antiga,
        data_mais_recente,
        total,
        resumo_itens: {
          pagina,
          maximo_paginas,
          limite,
          registros,
          resultado: resumo_itens,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  resumo_item: RequestHandler = async (req, res, next) => {
    const item_id = Number(req.params.id);
    const filtro_data = extrair_intervalo(req);
    const filtros: Prisma.Venda_ItemWhereInput = {
      item_id,
    };

    if (filtro_data) {
      filtros.venda = {
        data: filtro_data,
      };
    }

    try {
      validar_id(item_id);

      const item = await Tabela_Item.findFirst({
        where: {
          id: item_id,
        },
        select: {
          nome: true,
        },
      });

      if (!item) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum item",
          mensagem: "Não foi possível recuperar o resumo de vendas do item",
        } as Erro;
      }

      const total_vendas = await Tabela_Venda_Item.findMany({
        where: filtros,
        select: {
          quantidade: true,
          valor_venda: true,
        },
      }).then((res) => {
        return res
          .map(({ quantidade, valor_venda }) => {
            const total = Number(quantidade) * Number(valor_venda);

            return total;
          })
          .reduce((prev, curr) => prev + curr)
          .toFixed(2);
      });

      const venda_item = await Tabela_Venda_Item.aggregate({
        where: filtros,
        _sum: {
          valor_venda: true,
          quantidade: true,
        },
      });

      const resumo_vendas = await Tabela_Venda.aggregate({
        where: {
          venda_item: {
            some: { item_id },
          },
          data: filtro_data,
        },
        _max: {
          data: true,
        },
        _min: {
          data: true,
        },
      });

      const {
        _max: { data: data_mais_recente },
        _min: { data: data_mais_antiga },
      } = resumo_vendas;

      const {
        _sum: { quantidade: quantidade },
      } = venda_item;

      const valor_medio = (Number(total_vendas) / Number(quantidade)).toFixed(
        2
      );

      res.status(200).send({
        id: item_id,
        nome: item.nome,
        valor_medio,
        quantidade,
        total_vendas,
        data_mais_recente,
        data_mais_antiga,
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
