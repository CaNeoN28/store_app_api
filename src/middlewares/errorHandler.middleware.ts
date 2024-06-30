import { ErrorRequestHandler } from "express";
import { Erro } from "../types/resposta";

const errorHandler: ErrorRequestHandler = async (err, req, res, next) => {
  try {
    const { codigo, erro, mensagem } = err as Erro;

    res.status(codigo).send({
      mensagem,
      erro,
    });
  } catch (_) {
    console.log(err)
    res.status(500).send({ mensagem: "Erro interno do servidor", erro: err });
  }
};

export default errorHandler;
