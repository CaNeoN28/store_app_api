import { Erro, Perda } from "../../types";

export default function validar_perda(dados: Perda) {
  const { itens } = dados;
  const erros_perda: { [k: string]: any } = {};

  if (!Array.isArray(itens) || itens.length <= 0) {
    erros_perda.itens = "Itens deve ser uma lista com pelo menos um item";
  } else {
    const erros_itens: { [k: string]: any } = {};

    itens.map((item, index) => {
      const { id, quantidade } = item;
      const erro_item: { [k: string]: any } = {};

      if (!id) {
        erro_item.id = "O id do item é obrigatório";
      } else if (isNaN(id) || id <= 0) {
        erro_item.id = "O id do item está inválido";
      }

      if (!quantidade) {
        erro_item.quantidade = "A quantidade é obrigatória";
      } else if (isNaN(quantidade) || quantidade <= 0) {
        erro_item.quantidade = "A quantidade deve ser um número maior que zero";
      }

      if (Object.keys(erro_item).length > 0) {
        erros_itens[index] = erro_item;
      }
    });

    if (Object.keys(erros_itens).length > 0) {
      erros_perda.itens = erros_itens;
    }
  }

  if (Object.keys(erros_perda).length > 0) {
    throw{
        codigo: 400,
        erro: erros_perda,
        mensagem: "Erro de validação de perda"
    } as Erro
  }
}
