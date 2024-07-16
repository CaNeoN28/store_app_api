import { NextFunction, Request, Response } from "express";
import { Erro } from "../types";
import path from "path";

export default function image_getter(folder_name?: string) {
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
        console.log(err);
      });
    } catch (err) {
      next(err);
    }
  };
}
