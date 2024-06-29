import { ErrorRequestHandler } from "express";
import { Erro } from "../types/resposta";

const errorHandler: ErrorRequestHandler = async (err, req, res, next) => {
  try {
    const { codigo, erro, mensagem } = err as Erro;

    res.status(codigo).send({
      mensagem,
      erro,
    });
  } catch (err) {
    res.status(500).send("Erro interno do servidor");
  }
};

export default errorHandler;
