import { NextFunction, Request, RequestHandler, Response } from "express";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";

export default function image_handler(folder_name?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
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

      if (Array.isArray(image)) {
        erros = {
          codigo: 400,
          erro: "O limite permitido para imagens é de uma imagem",
          mensagem: "Não foi possível salvar a imagem",
        };
      } else if (!/^image/.test(image.mimetype)) {
        erros = {
          codigo: 400,
          erro: "Apenas o envio de imagens é permitido",
          mensagem: "Não foi possível salvar o arquivo",
        };
      } else {
        let directory = path.resolve("./");
        directory = path.join(directory, "/files/");

        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory);
        }

        if (folder_name) {
          directory = path.join(directory, `/${folder_name}/`);

          if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
          }
        }

        const extensao = image.name.split(".").at(-1);
        const nome = uuid() + "." + extensao;
        const nome_completo = directory + nome;

        image.name = nome;

        (req.file = image), (req.file_path = nome_completo);

        next();
      }
    }

    if (erros) {
      const { codigo, erro, mensagem } = erros;
      res.status(codigo).send({
        mensagem,
        erro,
      });
    }
  };
}
