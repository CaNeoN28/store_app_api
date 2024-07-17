import { Metodo, Prisma } from "@prisma/client";
import { Erro, Usuario } from "../types";
import Controller from "./Controller";
import { RequestHandler } from "express";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import { criptografar_senha } from "../utils/senhas";
import { validar_id, validar_usuario } from "../utils/validacao";
import ordenar_documentos from "../utils/ordenar_documentos";
import { Tabela_Usuario } from "../db/tabelas";
import definir_query from "../utils/definir_query";
import { extrair_paginacao } from "../utils/extracao_request";
import fs from "fs";
import path from "path";

export default class Controller_Usuarios extends Controller {
  get_id: RequestHandler = async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      validar_id(id);

      const usuario = await Tabela_Usuario.findFirst({
        where: { id },
        select: this.selecionar_campos(),
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

    const { limite, pagina } = extrair_paginacao(req);

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

    try {
      const query = definir_query(
        filtros,
        ordenar_documentos(ordenar, Tabela_Usuario),
        this.selecionar_campos(),
        limite,
        pagina
      );

      const registros = (await Tabela_Usuario.count({ where: filtros })) | 0;
      const usuarios = await Tabela_Usuario.findMany(query);

      const maximo_paginas =
        registros > 0 ? 1 + Math.floor(registros / limite) : 0;

      res.status(200).send({
        pagina,
        maximo_paginas,
        registros,
        limite,
        resultado: usuarios,
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

      const usuario = await Tabela_Usuario.create({
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
        select: this.selecionar_campos(),
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
      const usuario_antigo = await Tabela_Usuario.findFirst({
        where: {
          id,
        },
      });
      let usuario_novo: any = undefined;
      validar_id(id);

      if (metodo == "PATCH") {
        validar_usuario(data);

        if (senha) senha = await criptografar_senha(senha);

        usuario_novo = await Tabela_Usuario.update({
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
          select: this.selecionar_campos(),
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

        usuario_novo = await Tabela_Usuario.upsert({
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
          select: this.selecionar_campos(),
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

      await Tabela_Usuario.delete({
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

  visualizar_imagem: RequestHandler = async (req, res, next) => {
    const caminho = req.params.caminho;

    const caminho_relativo = path.resolve("./files/usuario");
    const cmainho_completo = path.join(caminho_relativo, caminho);

    res.sendFile(cmainho_completo, (err) => {
      if (err) {
        res.status(404).send({
          mensagem: "Não foi possível visualizar a imagem",
          erro: "O arquivo não pode ser encontrado",
        });
      }
    });
  };
  inserir_imagem: RequestHandler = async (req, res, next) => {
    const file = req.file!;
    const file_path = req.file_path!;

    const id = Number(req.params.id);

    try {
      validar_id(id);

      res.status(201).send(file_path);
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos() {
    const selecionados: Prisma.UsuarioSelect = {
      id: true,
      nome_usuario: true,
      nome_completo: true,
      email: true,
      numero_telefone: true,
      foto_url: true,
      senha: false,
      grupos: {
        select: {
          id: true,
          nome: true,
          acessos: {
            select: {
              tabela: true,
              metodo: true,
            },
          },
        },
      },
    };

    return selecionados;
  }
}
