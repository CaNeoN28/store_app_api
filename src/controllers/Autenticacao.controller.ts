import { Prisma } from "@prisma/client";
import Controller from "./Controller";
import { Erro, Login } from "../types";
import { RequestHandler } from "express-serve-static-core";
import { comparar_senha } from "../utils/senhas";
import { gerar_token_usuario } from "../utils/jwt";

export default class Controller_Autenticacao extends Controller {
  protected selecionados: Prisma.UsuarioSelect;
  tabela: Prisma.UsuarioDelegate;

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
        acessos: true,
        usuarios: true,
      },
    };
  }

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
    this.validar_dados({ nome_usuario, senha });

    const usuario = await this.tabela.findFirst({
      where: {
        nome_usuario,
      },
      select: {
        ...this.selecionados,
        senha: true,
      },
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
    const { user_id, user_name } = req;

    res.send({
      user_id,
      user_name,
    });
  };

  protected validar_dados(data: Login, validar_obrigatorios?: boolean): void {
    const { nome_usuario, senha } = data;
    const erros: { [k: string]: string } = {};

    if (!nome_usuario) {
      erros.nome_usuario = "Nome de usuário é obrigatório";
    }

    if (!senha) {
      erros.senha = "Senha é obrigatório";
    }

    if (Object.keys(erros).length > 0) {
      throw {
        codigo: 401,
        erro: erros,
        mensagem: "Não foi possível realizar login  ",
      } as Erro;
    }
  }
}
