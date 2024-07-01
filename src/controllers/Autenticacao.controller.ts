import { Prisma } from "@prisma/client";
import Controller from "./Controller";
import { Erro, Login } from "../types";
import { RequestHandler } from "express-serve-static-core";

export default class Controller_Autenticacao extends Controller {
  protected selecionados: Prisma.UsuarioSelect;
  tabela: Prisma.UsuarioDelegate;

  constructor() {
    super("usuario");

    this.tabela = Controller.delegar_tabela(
      "usuario"
    ) as Prisma.UsuarioDelegate;

    this.selecionados = {};
    this.selecionar_todos_os_campos;
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

      res.status(200).send(resposta);
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

    return usuario;
  }

  protected validar_dados(data: Login, validar_obrigatorios?: boolean): void {
    const { nome_usuario, senha } = data;
    const erros: { [k: string]: string } = {};

    if (Object.keys(erros).length > 0) {
      throw {
        codigo: 401,
        erro: erros,
        mensagem: "Não foi possível realizar login  ",
      } as Erro;
    }
  }
}
