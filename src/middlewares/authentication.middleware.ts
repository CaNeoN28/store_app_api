import { NextFunction, Request, Response } from "express";
import { verificar_token_usuario } from "../utils/jwt";
import { Metodo, Tabela } from "../types";
import { Tabela_Usuario } from "../db/tabelas";

export default function authentication_middleware(tabela?: Tabela) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies["acess-token"];

    if (!token) {
      return res.status(403).send("Não foi possível realizar a autenticação");
    }

    const dados_usuario = verificar_token_usuario(token);

    if (dados_usuario) {
      const metodo = req.method as Metodo;
      const { id } = dados_usuario;

      const usuario = await Tabela_Usuario.findFirst({
        where: { id },
        select: {
          id: true,
          nome_usuario: true,
          grupos: {
            select: {
              id: true,
              acessos: {
                select: {
                  metodo: true,
                  tabela: true,
                },
                where: tabela
                  ? {
                      metodo,
                      tabela,
                    }
                  : {},
              },
            },
            where: {
              acessos: tabela
                ? {
                    some: {
                      metodo,
                      tabela,
                    },
                  }
                : {},
            },
          },
        },
      });

      if (usuario) {
        req.user = usuario;

        if (tabela && usuario.grupos.length == 0) {
          return res
            .status(403)
            .send("Você não tem permissão para usar esta rota");
        }

        return next();
      }

      res.status(403).send("Não foi possível realizar a autenticação");
    } else {
      return res.status(403).send("Não foi possível realizar a autenticação");
    }
  };
}
