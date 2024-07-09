import { Erro, Venda } from "../../types";
import validar_id from "./validar_id";

export default function validar_venda(dados: Venda) {
  const { itens, cliente_id } = dados;
  const erros: { [k: string]: string } = {};

  if (cliente_id) {
    try {
      validar_id(cliente_id);
    } catch (err) {
      erros.cliente_id = "O id do cliente é inválido";
    }
  }

  if (Array.isArray(itens) && itens.length > 0) {
  } else {
    erros.itens = "Itens deve ser uma lista com pelo menos um elemento";
  }

  if (Object.keys(erros).length > 0) {
    throw {
      codigo: 400,
      erro: erros,
      mensagem: "Erro de validação de venda",
    } as Erro;
  }
}
