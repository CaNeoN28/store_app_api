import { Prisma } from "@prisma/client";
import { Erro, Usuario } from "../types";
import Controller from "./Controller";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { REGEX_EMAIL, REGEX_NOME_USUARIO, REGEX_SENHA } from "../utils/regex";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

export default class Controller_Usuarios extends Controller {
  tabela: Prisma.UsuarioDelegate;

  protected selecionados: Prisma.UsuarioSelect;

  constructor() {
    super("usuario");

    this.tabela = Controller.delegar_tabela(
      "usuario"
    ) as Prisma.UsuarioDelegate;

    this.selecionados = {};
    this.selecionar_todos_os_campos();
    this.selecionados.senha = false;
    this.selecionados.grupos = {
      select: {
        id: true,
        nome: true,
        acessos: {
          select: {
            metodo: true,
            tabela: true,
          },
        },
      },
    };
  }

  list: RequestHandler = async (req, res, next) => {
    const {
      nome_completo,
      nome_usuario,
      email,
      nome_grupo,
      ordenar,
      limite,
      pagina,
    } = req.query;
    const filtros: Prisma.UsuarioWhereInput = {};

    if (nome_completo) {
      filtros.nome_completo = {
        contains: String(nome_completo),
        mode: "insensitive",
      };
    }

    if (nome_usuario) {
      filtros.nome_usuario = {
        contains: String(nome_usuario),
        mode: "insensitive",
      };
    }

    if (email) {
      filtros.email = {
        contains: String(email),
        mode: "insensitive",
      };
    }

    if (nome_grupo) {
      filtros.grupos = {
        some: {
          nome: {
            contains: String(nome_grupo),
            mode: "insensitive",
          },
        },
      };
    }

    const ordenacao = this.formatar_ordenacao(
      ordenar
    ) as Prisma.UsuarioOrderByWithRelationInput;

    try {
      const resposta = await this.find_many(
        filtros,
        ordenacao,
        Number(limite),
        Number(pagina)
      );

      res.status(200).send(resposta);
    } catch (err) {
      next(err);
    }
  };
  protected find_many = async (
    filtros: Prisma.UsuarioWhereInput,
    ordenacao: Prisma.UsuarioOrderByWithRelationInput,
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

    const registros = (await this.tabela.count({ where: filtros })) | 0;
    const resultado = await this.tabela.findMany(query);

    const maximo_paginas =
      registros > 0 ? 1 + Math.floor(registros / limite) : 0;

    return {
      resultado,
      pagina,
      maximo_paginas,
      registros,
      limite,
    };
  };

  create: RequestHandler = async (req, res, next) => {
    const {
      email,
      foto_url,
      grupos,
      nome_completo,
      nome_usuario,
      numero_telefone,
      senha,
    }: Usuario = req.body;

    try {
      const usuario = await this.insert_one({
        email,
        foto_url,
        grupos,
        nome_completo,
        nome_usuario,
        numero_telefone,
        senha,
      });

      res.status(201).send(usuario);
    } catch (err) {
      next(err);
    }
  };
  protected insert_one = async (data: Usuario) => {
    this.validar_dados(data, true);
    let { grupos, senha } = data;

    const usuario = await this.tabela
      .create({
        data: {
          ...data,
          senha,
          grupos: {
            connect:
              grupos &&
              grupos.map((g) => ({
                id: g.id,
              })),
          },
        },
        select: this.selecionados,
      })
      .then((res) => res)
      .catch((err) => {
        const { codigo, erro } = verificar_erro_prisma(err);

        throw {
          codigo,
          erro,
          mensagem: "Não foi possível criar usuário",
        } as Erro;
      });

    return usuario;
  };

  update_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);
    const {
      email,
      foto_url,
      nome_completo,
      nome_usuario,
      numero_telefone,
      senha,
      grupos,
    }: Usuario = req.body;
    const metodo = (req.method as "PATCH") || "PUT";

    const data = {
      email,
      foto_url,
      nome_completo,
      nome_usuario,
      numero_telefone,
      senha,
      grupos,
    };

    try {
      const resposta =
        metodo == "PATCH"
          ? await this.update_one(id, data)
          : metodo == "PUT" && (await this.upsert_one(id, data));

      res.status(200).send(resposta);
    } catch (err) {
      next(err);
    }
  };
  protected update_one = async (id: number, data: Usuario) => {
    Controller.validar_id(id);
    this.validar_dados(data);

    let { grupos, senha } = data;

    const usuario_novo = await this.tabela
      .update({
        where: {
          id,
        },
        data: {
          ...data,
          grupos: {
            set: [],
            connect:
              grupos &&
              grupos.map((g) => ({
                id: g.id,
              })),
          },
          senha,
        },
        select: this.selecionados,
      })
      .then((res) => res)
      .catch((err) => {
        const { codigo, erro } = verificar_erro_prisma(err);

        throw {
          codigo,
          erro,
          mensagem: "Não foi possível atualizar o usuário",
        } as Erro;
      });

    return usuario_novo;
  };
  protected upsert_one = async (id: number, data: Usuario) => {
    Controller.validar_id(id);
    this.validar_dados(data, true);

    let { grupos, senha } = data;

    const usuario_novo = await this.tabela
      .upsert({
        where: {
          id,
        },
        create: {
          id,
          ...data,
          senha,
          grupos: {
            connect:
              grupos &&
              grupos.map((g) => ({
                id: g.id,
              })),
          },
        },
        update: {
          ...data,
          senha,
          grupos: {
            connect:
              grupos &&
              grupos.map((g) => ({
                id: g.id,
              })),
          },
        },
      })
      .then((res) => res)
      .catch((err) => {
        const { codigo, erro } = verificar_erro_prisma(err);

        throw {
          codigo,
          erro,
          mensagem: "Não foi possível salvar usuário",
        } as Erro;
      });

    return usuario_novo;
  };

  protected validar_dados(
    data: Usuario,
    validar_obrigatorios?: boolean | undefined
  ) {
    const {
      email,
      foto_url,
      grupos,
      nome_completo,
      nome_usuario,
      numero_telefone,
      senha,
    } = data;
    const erros: { [k: string]: any } = {};

    if (validar_obrigatorios && !nome_completo) {
      erros.nome_completo = "Nome completo é obrigatório";
    }

    if (validar_obrigatorios && !nome_usuario) {
      erros.nome_usuario = "Nome de usuário é obrigatório";
    } else if (nome_usuario && !REGEX_NOME_USUARIO.test(nome_usuario)) {
      erros.nome_usuario = "Nome de usuário inválido";
    }

    if (validar_obrigatorios && !senha) {
      erros.senha = "Senha é obrigatório";
    } else if (senha && !REGEX_SENHA.test(senha)) {
      erros.senha = "Senha inválida";
    }

    if (email && !REGEX_EMAIL.test(email)) {
      erros.email = "Email inválido";
    }

    if (grupos) {
      if (!Array.isArray(grupos)) {
        erros.grupos = "Deve ser uma lista";
      } else if (grupos.length > 0) {
        grupos.map((g, i) => {
          if (!g.id) {
            if (!erros.grupos) {
              erros.grupos = {};
            }

            erros.grupos[i] = "O id de um grupo é necessário";
          }
        });
      }
    }

    if (Object.keys(erros).length > 0) {
      throw {
        codigo: 400,
        erro: erros,
        mensagem: "Erro ao validar dados do usuário",
      } as Erro;
    }
  }
}
