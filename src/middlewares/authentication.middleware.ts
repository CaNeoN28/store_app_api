import { NextFunction, Request, Response } from "express";
import { verificar_token_usuario } from "../utils/jwt";
import prisma from "../db/prisma";

export default async function authentication_middleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies["acess-token"];

  if (!token) {
    return res.status(403).send("Não foi possível realizar a autenticação");
  }

  const dados_usuario = verificar_token_usuario(token);

  if (dados_usuario) {
    const { id, nome_usuario } = dados_usuario;

    const usuario = await prisma.usuario.findFirst({
      where: { id },
      select: {
        id: true,
      },
    });

    if (usuario) {
      (req.user_id = id), (req.user_name = nome_usuario);
      return next();
    }

    res.status(403).send("Não foi possível realizar a autenticação");
  } else {
    return res.status(403).send("Não foi possível realizar a autenticação");
  }
}
