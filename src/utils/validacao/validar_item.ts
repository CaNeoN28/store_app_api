import { Erro, Item } from "../../types";

function validar_item(
  {
    nome,
    unidade_id,
    desconto_porcentagem,
    id,
    validade_desconto,
    valor_atual,
  }: Item,
  validar_obrigatorios?: boolean
) {
  const erros: {
    [k: string]: string;
  } = {};

  if (!nome) {
    if (validar_obrigatorios) erros.nome = "O nome do item é obrigatório";
  }

  if (!unidade_id) {
    if (validar_obrigatorios)
      erros.unidade_id = "O id da unidade do item é obrigatório";
  } else if (isNaN(unidade_id)) {
    erros.unidade_id = "O id da unidade deve ser um número";
  } else if (unidade_id < 0) {
    erros.unidade_id = "O id da unidade deve ser positivo";
  }

  if (desconto_porcentagem) {
    if (isNaN(desconto_porcentagem)) {
      erros.desconto_porcentagem = "O desconto deve ser um número";
    } else if (desconto_porcentagem < 0) {
      erros.desconto_porcentagem = "O desconto deve ser positivo";
    } else if (desconto_porcentagem > 100) {
      erros.desconto_porcentagem = "O desconto não deve ser maior que 100%";
    }
  }

  if (id) {
    if (isNaN(id)) {
      erros.id = "O id deve ser um número";
    } else if (id < 0) {
      erros.id = "O id deve ser positivo";
    }
  }

  if (validade_desconto) {
    if (isNaN(Number(validade_desconto))) {
      erros.validade_desconto =
        "A validade do desconto deve ser uma data válida";
    }
  }

  if (valor_atual) {
    if (isNaN(valor_atual)) {
      erros.valor_atual = "O valor atual deve ser um número";
    } else if (valor_atual < 0) {
      erros.valor_atual = "O valor atual deve ser maior que zero";
    }
  }

  if (Object.keys(erros).length > 0) {
    throw {
      codigo: 400,
      erro: erros,
      mensagem: "Erro de validação de item",
    } as Erro;
  }
}

export default validar_item;
