import { Prisma } from "@prisma/client";
import Controller from "./Controller";
import { Erro, Login, Usuario } from "../types";
import { RequestHandler } from "express-serve-static-core";
import { comparar_senha } from "../utils/senhas";
import { gerar_token_usuario } from "../utils/jwt";
import { validar_login } from "../utils/validacao";
import { Tabela_Usuario } from "../db/tabelas";

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
    const user = req.user!;

    res.send(user);
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

    const user = req.user!;

    try {
      res.status(200).send("Alteração de perfil");
    } catch (err) {
      next(err);
    }
  };

  protected selecionar_campos(senha?: boolean) {
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
