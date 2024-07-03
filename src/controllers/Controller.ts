import { RequestHandler } from "express";
import prisma from "../db/prisma";
import { Tabela_Prisma } from "../types";

export default abstract class Controller {
  static ORDENACAO_PADRAO = { id: "asc" };
  static PAGINA_EXIBICAO_PADRAO = 1;
  static LIMITE_EXIBICAO_PADRAO = 10;

  tabela: any;

  protected abstract selecionados: any;
  protected ordenacao: any;

  constructor(tabela: Tabela_Prisma) {
    this.ordenacao = Controller.ORDENACAO_PADRAO;
    this.tabela = prisma[tabela];
  }

  //Métodos referentes às requests
  get_id: RequestHandler = async (req, res, next) => {};
  list: RequestHandler = async (req, res, next) => {};
  create: RequestHandler = async (req, res, next) => {};
  update_by_id: RequestHandler = async (req, res, next) => {};
  remove_by_id: RequestHandler = async (req, res, next) => {};

  protected formatar_ordenacao(campo: any) {
    const formatado = String(campo).replace("-", "");
    const descendente = String(campo).startsWith("-");
    const campos = Object.keys(this.tabela.fields);

    if (campos.find((c) => c == formatado)) {
      return {
        [formatado]: descendente ? "desc" : "asc",
      };
    } else {
      return Controller.ORDENACAO_PADRAO;
    }
  }

  protected selecionar_todos_os_campos() {
    const campos = Object.keys(this.tabela.fields);
    const selecionados: any = {};

    campos.map((c) => {
      selecionados[c] = true;
    });

    this.selecionados = selecionados;
  }

  static delegar_tabela(tabela: Tabela_Prisma) {
    return prisma[tabela];
  }

  static validar_id(id: number) {
    if (isNaN(id)) {
      throw {
        codigo: 400,
        erro: "O id informado é inválido",
        mensagem: "Não foi possível recuperar o item",
      };
    }
  }

  static definir_query(filtros: any, ordenacao: any, selecionados: any, limite: number, pagina: number){
    if (isNaN(limite)) limite = Controller.LIMITE_EXIBICAO_PADRAO;
    if (isNaN(pagina)) pagina = Controller.PAGINA_EXIBICAO_PADRAO;

    return {
      where: filtros,
      orderBy: ordenacao,
      select: selecionados,
      skip: (pagina - 1) * limite,
      take: limite,
    }
  }
}
