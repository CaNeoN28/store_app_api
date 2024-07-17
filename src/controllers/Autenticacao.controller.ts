import { Metodo, Prisma } from "@prisma/client";
import Controller from "./Controller";
import { Erro, Login, Usuario } from "../types";
import { RequestHandler } from "express-serve-static-core";
import { comparar_senha } from "../utils/senhas";
import { gerar_token_usuario } from "../utils/jwt";
import { validar_login, validar_usuario } from "../utils/validacao";
import { Tabela_Usuario } from "../db/tabelas";
import verificar_erro_prisma from "../utils/verificar_erro_prisma";
import fs from "fs";
import path from "path";

const API_URL = process.env.API_URL || "";

export default class Controller_Autenticacao extends Controller {
  realizar_login: RequestHandler = async (req, res, next) => {
    const { nome_usuario, senha }: Login = req.body;

    try {
      const resposta = await this.login_handler({ nome_usuario, senha });

      res
        .status(200)
        .cookie("acess-token", resposta.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })
        .send(resposta.dados);
    } catch (err) {
      next(err);
    }
  };
  protected async login_handler({ nome_usuario, senha }: Login) {
    validar_login({ nome_usuario, senha });

    const usuario = await Tabela_Usuario.findFirst({
      where: {
        nome_usuario,
      },
      select: this.selecionar_campos(true),
    });

    if (usuario && (await comparar_senha(senha, usuario.senha))) {
      const { nome_usuario, id } = usuario;

      return {
        token: gerar_token_usuario({ nome_usuario, id }),
        dados: {
          ...usuario,
          senha: undefined,
        },
      };
    }

    throw {
      codigo: 401,
      erro: "Os dados não correspondem",
      mensagem: "Não foi possível realizar a autenticação",
    } as Erro;
  }

  visualizar_perfil: RequestHandler = async (req, res, next) => {
    const { id } = req.user!;

    const usuario = await Tabela_Usuario.findFirst({
      where: {
        id,
      },
      select: this.selecionar_campos(),
    });

    res.send(usuario);
  };

  alterar_perfil: RequestHandler = async (req, res, next) => {
    const {
      email,
      foto_url,
      nome_completo,
      nome_usuario,
      numero_telefone,
      senha,
    }: Usuario = req.body;

    const usuario = req.user!;

    const metodo = req.method as Metodo;

    const data = {
      email,
      foto_url,
      nome_completo,
      nome_usuario,
      numero_telefone,
      senha,
    };

    try {
      let usuario_novo: any = undefined;

      if (metodo == "PATCH") {
        validar_usuario(data);

        usuario_novo = await Tabela_Usuario.update({
          where: {
            id: usuario.id,
          },
          data,
          select: this.selecionar_campos(),
        })
          .then((res) => res)
          .catch((err) => {
            const { codigo, erro } = verificar_erro_prisma(err);

            throw {
              codigo,
              erro,
              mensagem: "Não foi possível alterar o perfil",
            } as Erro;
          });
      }

      res.status(200).send(usuario_novo);
    } catch (err) {
      next(err);
    }
  };
  atualizar_imagem: RequestHandler = async (req, res, next) => {
    const { id } = req.user!;
    const file = req.file!;
    const file_path = req.file_path!;

    try {
      const { foto_url } = await Tabela_Usuario.update({
        where: {
          id,
        },
        data: {
          foto_url: `${API_URL}/usuarios/imagens/${file.name}`,
        },
        select: {
          foto_url: true,
        },
      });

      file.mv(file_path);

      res.status(201).send(foto_url);
    } catch (err) {
      next(err);
    }
  };
  remover_imagem: RequestHandler = async (req, res, next) => {
    const user = req.user!;

    try {
      const usuario = await Tabela_Usuario.findFirst({
        where: { id: user.id },
        select: { foto_url: true },
      });

      const { foto_url } = usuario!;

      if (!foto_url) {
        throw {
          codigo: 404,
          erro: "O seu usuário não possui uma imagem",
          mensagem: "Não foi possível remover a imagem",
        } as Erro;
      }

      const nome_imagem = foto_url.split("/").at(-1)!;
      const caminho_relativo = path.resolve("./files/usuarios");
      const caminho_completo = path.join(caminho_relativo, nome_imagem);

      fs.rm(caminho_completo, async (err) => {
        if (err) {
          res.status(404).send({
            mensagem: "Não foi possível remover a imagem",
            erro: "O seu usuário não possui uma imagem",
          });
        } else {
          await Tabela_Usuario.update({
            where: { id: user.id },
            data: { foto_url: { set: null } },
          });
          res.status(204).send();
        }
      });
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos(senha = false) {
    const selecionados: Prisma.UsuarioSelect = {
      id: true,
      nome_usuario: true,
      nome_completo: true,
      email: true,
      numero_telefone: true,
      foto_url: true,
      senha,
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
