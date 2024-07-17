import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";
import { Erro } from "../types";

type Folder = "item";

export default class Image_Handler {
  static get_image(folder_name?: Folder) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const caminho_item = req.params.caminho;

      try {
        if (!caminho_item) {
          throw {
            codigo: 400,
            erro: "É necessário informar o caminho do arquivo",
            mensagem: "Não foi possível recuperar a imagem",
          } as Erro;
        }

        const caminho_relativo = path.resolve(
          folder_name ? `./files/${folder_name}` : "./files"
        );
        const caminho_completo = path.join(caminho_relativo, caminho_item);

        res.sendFile(caminho_completo, (err) => {
          if (err) {
            res.status(404).send({
              erro: "O arquivo não pôde ser encontrado",
              mensagem: "Não foi possível recuperar a imagem",
            });
          }
        });
      } catch (err) {
        next(err);
      }
    };
  }

  static insert_image(folder_name?: Folder) {
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

  static remove_image(folder_name?: Folder) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { caminho } = req.params;

      try {
        if (!caminho) {
          throw {
            codigo: 400,
            erro: "É necessário informar o caminho da imagem",
            mensagem: "Não foi possível remover a imagem",
          } as Erro;
        }

        const caminho_relativo = path.resolve("./files");

        const caminho_completo = path.join(
          caminho_relativo,
          folder_name ? folder_name : "",
          caminho
        );

        fs.rm(caminho_completo, (err) => {
          if (err) {
            const erros = {
              codigo: 404,
              erro: "O arquivo não pode ser encontrado",
              mensagem: "Não foi possível remover a imagem",
            } as Erro;

            next(erros);
          } else {
            res.status(204).send();
          }
        });
      } catch (err) {
        next(err);
      }
    };
  }
}
