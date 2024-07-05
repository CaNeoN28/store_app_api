import { Compra, Erro } from "../../types";
import validar_id from "./validar_id";

export default function validar_compra(dados: Compra) {
  const { fornecedor_id, itens } = dados;
  const erros: { [k: string]: any } = {};

  try {
    validar_id(fornecedor_id);
  } catch (_) {
    erros.fornecedor_id = "O id do fornecedor é inválido";
  }

  if (!Array.isArray(itens)) {
    erros.itens = "Deve ser uma lista";
  } else {
    itens.map((item, index) => {
      const erros_item: { [k: string]: string } = {};

      const { item_id, quantidade, valor_combinado } = item;
      try {
        validar_id(item_id);
      } catch (_) {
        erros_item.item_id = "O id do item é inválido";
      }

      if (isNaN(quantidade)) {
        erros_item.quantidade = "A quantidade informada é inválida";
      } else if (quantidade <= 0) {
        erros_item.quantidade = "A quantidade deve ser maior do que zero";
      }

      if (isNaN(valor_combinado)) {
        erros_item.valor_combinado = "Valor combinado é inválido";
      } else if (valor_combinado <= 0) {
        erros_item.valor_combinado =
          "O valor combinado deve ser maior do que zero";
      }

      if (Object.keys(erros_item).length > 0) {
        if (!erros.itens) {
          erros.itens = {};
        }

        erros.itens[index] = erros_item;
      }
    });
  }

  if (Object.keys(erros).length > 0) {
    throw {
      codigo: 400,
      erro: erros,
      mensagem: "Erro de validação de compra",
    } as Erro;
  }
}
