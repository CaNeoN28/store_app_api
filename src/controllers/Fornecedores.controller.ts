import { Prisma } from "@prisma/client";
import { Erro, Fornecedor } from "../types";
import Controller from "./Controller";
import { RequestHandler } from "express";
import validar_cnpj from "../utils/validacao/validar_cnpj";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";

export default class Controller_Fornecedor extends Controller {
  protected selecionados: Prisma.FornecedorSelect;
  tabela: Prisma.FornecedorDelegate;

  constructor() {
    super("fornecedor");

    this.tabela = Controller.delegar_tabela(
      "fornecedor"
    ) as Prisma.FornecedorDelegate;

    this.selecionados = {};
    this.selecionar_todos_os_campos();
    this.selecionados.compras = {};
  }

  list: RequestHandler = async (req, res, next) => {
    try {
      const resposta = await this.find_many({}, {}, 10, 1);

      res.status(200).send(resposta);
    } catch (err) {
      next(err);
    }
  };
  protected find_many = async (
    filtros: Prisma.FornecedorWhereInput,
    ordenacao: Prisma.FornecedorOrderByWithRelationInput,
    limite: number,
    pagina: number
  ) => {
    const query = Controller.definir_query(
      filtros,
      ordenacao,
      this.selecionados,
      limite,
      pagina
    );

    const fornecedores = await this.tabela.findMany(query);

    return fornecedores;
  };

  create: RequestHandler = async (req, res, next) => {
    const usuario = req.user!;
    const { cnpj, nome }: Fornecedor = req.body;

    try {
      const fornecedor = await this.insert_one({ cnpj, nome }, usuario.id);

      res.status(201).send(fornecedor);
    } catch (err) {
      next(err);
    }
  };

  protected insert_one = async (data: Fornecedor, id_usuario?: number) => {
    this.validar_dados(data, true);

    const fornecedor = await this.tabela
      .create({
        data: {
          cnpj: data.cnpj,
          nome: data.nome,
        },
        select: this.selecionados,
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

    return fornecedor;
  };

  protected validar_dados(data: Fornecedor, validar_obrigatorios?: boolean) {
    const { cnpj, nome } = data;
    const erros: {
      [k: string]: any;
    } = {};

    if (validar_obrigatorios) {
      if (!cnpj) {
        erros.cnpj = "CNPJ é obrigatório";
      }

      if (!nome) {
        erros.nome = "Nome é obrigatório";
      }
    }

    if (cnpj && !validar_cnpj(cnpj)) {
      erros.cnpj = "CNPJ é inválido";
    }

    if (Object.keys(erros).length > 0) {
      throw {
        codigo: 400,
        erro: erros,
        mensagem: "Erro de validação de grupo",
      } as Erro;
    }
  }
}
