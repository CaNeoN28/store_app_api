import { Cliente, Erro } from "../../types";
import validar_cnpj from "./validar_cnpj";

export default function validar_cliente(
  dados: Cliente,
  validar_obrigatorios?: boolean
) {
  const { cnpj, nome } = dados;

  const erros: { [k: string]: string } = {};

  if (validar_obrigatorios && !cnpj) {
    erros.cnpj = "CNPJ é obrigatório";
  } else if (cnpj && !validar_cnpj(cnpj)) {
    erros.cnpj = "CNPJ inválido";
  }

  if (validar_obrigatorios && !nome) {
    erros.nome = "Nome é obrigatório";
  }

  if (Object.keys(erros).length > 0) {
    throw {
      codigo: 400,
      erro: erros,
      mensagem: "Erro de validação de cliente",
    } as Erro;
  }
}
