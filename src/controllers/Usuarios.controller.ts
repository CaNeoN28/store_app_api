import { Metodo, Prisma } from "@prisma/client";
import { Erro, Usuario } from "../types";
import Controller from "./Controller";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { REGEX_EMAIL, REGEX_NOME_USUARIO, REGEX_SENHA } from "../utils/regex";
import { criptografar_senha } from "../utils/senhas";
import { validar_id, validar_usuario } from "../utils/validacao";
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

  get_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);

      const usuario = await this.tabela
        .findFirst({
          where: { id },
          select: this.selecionados,
        })
        .then((res) => res)
        .catch((err) => {
          const { codigo, erro } = verificar_erro_prisma(err);
          throw {
            codigo,
            erro,
            mensagem: "Não foi possível recuperar o usuário",
          } as Erro;
        });

      if (!usuario) {
        throw {
          codigo: 404,
          erro: "O id informado não corresponde a nenhum usuário",
          mensagem: "Não foi possível recuperar o usuário",
        } as Erro;
      }

      res.status(200).send(usuario);
    } catch (err) {
      next(err);
    }
  };
  list: RequestHandler = async (req, res, next) => {
    const { nome_completo, nome_usuario, email, nome_grupo, ordenar } =
      req.query;

    let limite = Number(req.params.limite),
      pagina = Number(req.params.pagina);

    if (isNaN(limite)) {
      limite = Controller.LIMITE_EXIBICAO_PADRAO;
    }
    if (isNaN(pagina)) {
      pagina = Controller.PAGINA_EXIBICAO_PADRAO;
    }

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
      const query = Controller.definir_query(
        filtros,
        ordenacao,
        this.selecionados,
        limite,
        pagina
      );

      const registros = (await this.tabela.count({ where: filtros })) | 0;
      const usuarios = await this.tabela.findMany(query);

      const maximo_paginas =
        registros > 0 ? 1 + Math.floor(registros / limite) : 0;

      res.status(200).send({
        resultado: usuarios,
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
    let {
      email,
      foto_url,
      grupos,
      nome_completo,
      nome_usuario,
      numero_telefone,
      senha,
    }: Usuario = req.body;

    try {
      validar_usuario(
        {
          email,
          foto_url,
          grupos,
          nome_completo,
          nome_usuario,
          numero_telefone,
          senha,
        },
        true
      );

      senha = await criptografar_senha(senha);

      const usuario = await this.tabela
        .create({
          data: {
            nome_completo,
            nome_usuario,
            email,
            foto_url,
            numero_telefone,
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

      res.status(200).send(usuario);
    } catch (err) {
      next(err);
    }
  };
  update_by_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);
    let {
      email,
      foto_url,
      nome_completo,
      nome_usuario,
      numero_telefone,
      senha,
      grupos,
    }: Usuario = req.body;
    const metodo = req.method as Metodo;

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
      const usuario_antigo = await this.tabela.findFirst({
        where: {
          id,
        },
      });
      let usuario_novo: any = undefined;
      validar_id(id);

      if (metodo == "PATCH") {
        validar_usuario(data);

        if (senha) senha = await criptografar_senha(senha);

        usuario_novo = await this.tabela
          .update({
            where: {
              id,
            },
            data: {
              email,
              foto_url,
              nome_completo,
              nome_usuario,
              numero_telefone,
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
      } else if (metodo == "PUT") {
        validar_usuario(data, true);

        usuario_novo = await this.tabela
          .upsert({
            where: {
              id,
            },
            create: {
              id,
              nome_completo,
              nome_usuario,
              email,
              foto_url,
              numero_telefone,
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
              email,
              foto_url,
              nome_completo,
              nome_usuario,
              numero_telefone,
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
              mensagem: "Não foi possível salvar usuário",
            } as Erro;
          });
      }

      res.status(usuario_antigo ? 200 : 201).send(usuario_novo);
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
            codigo,
            erro,
            mensagem: "Não foi possível remover o usuário",
          } as Erro;
        });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
