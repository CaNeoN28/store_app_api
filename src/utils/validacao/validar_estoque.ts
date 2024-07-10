import { Erro, Estoque } from "../../types";

export default function validar_estoque(
  dados: Estoque,
  validar_obrigatorios?: boolean
) {
  const { quantidade } = dados;
  const erros_estoque: { [k: string]: any } = {};

  if (validar_obrigatorios && !quantidade) {
    erros_estoque.quantidade = "Quantidade é obrigatória";
  } else if (quantidade && isNaN(quantidade) || quantidade < 0) {
    erros_estoque.quantidade = "Quantidade deve ser um número maior que zero";
  }

  if (Object.keys(erros_estoque).length > 0) {
    throw {
      codigo: 400,
      erro: erros_estoque,
      mensagem: "Erro de validação de estoque",
    } as Erro;
  }
}
