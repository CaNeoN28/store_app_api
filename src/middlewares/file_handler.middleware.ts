import { NextFunction, Request, Response } from "express";

export default async function file_handler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let erros: { codigo: number; mensagem: string; erro: any } | undefined =
    undefined;

  if (!req.files || !req.files.image) {
    erros = {
      codigo: 400,
      erro: "É necessário enviar uma imagem",
      mensagem: "Não foi possível realizar a operação",
    };
  } else {
    const { image } = req.files;

    console.log(image);
  }

  if (erros) {
    const { codigo, erro, mensagem } = erros;
    res.status(codigo).send({
      erro,
      mensagem,
    });
  }
}
