import { Erro, Venda } from "../../types";
import validar_id from "./validar_id";

export default function validar_venda(dados: Venda) {
  const { itens, cliente_id } = dados;
  const erros: { [k: string]: any } = {};

  if (cliente_id) {
    try {
      validar_id(cliente_id);
    } catch (err) {
      erros.cliente_id = "O id do cliente é inválido";
    }
  }

  if (Array.isArray(itens) && itens.length > 0) {
    const erros_itens: { [k: number]: any } = {};

    itens.map((item, index) => {
      const { item_id, quantidade, valor_combinado } = item;
      const erro_item: { [k: string]: any } = {};

      try {
        validar_id(item_id);
      } catch (_) {
        erro_item.item_id = "O id do cliente é inválido";
      }

      if (!quantidade) {
        erro_item.quantidade = "Quantidade é obrigatória";
      } else if (quantidade <= 0) {
        erro_item.quantidade = "Quantidade deve ser maior que zero";
      } else if (isNaN(quantidade)) {
        erro_item.quantidade = "Quantidade deve ser um número";
      }

      if (!valor_combinado) {
        erro_item.valor_combinado = "Valor combinado é obrigatório";
      } else if (isNaN(valor_combinado)) {
        erro_item.valor_combinado = "Valor combinado deve ser um número válido";
      } else if (valor_combinado <= 0) {
        erro_item.valor_combinado = "Valor combinado deve ser maior que zero";
      }

      if (Object.keys(erro_item).length > 0) {
        erros_itens[index] = erro_item;
      }
    });

    if (Object.keys(erros_itens).length > 0) {
      erros.itens = erros_itens;
    }

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
