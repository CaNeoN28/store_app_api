import { Erro, Fornecedor } from "../../types";
import validar_cnpj from "./validar_cnpj";

function validar_fornecedor(data: Fornecedor, validar_obrigatorios?: boolean) {
  const { cnpj, nome } = data;
  const erros: {
    [k: string]: any;
  } = {};

  if (validar_obrigatorios) {
    if (!cnpj) {
      erros.cnpj = "CNPJ é obrigatório";
    }

    if (!nome) {
      erros.nome = "Nome é obrigatório";
    }
  }

  if (cnpj && !validar_cnpj(cnpj)) {
    erros.cnpj = "CNPJ é inválido";
  }

  if (Object.keys(erros).length > 0) {
    throw {
      codigo: 400,
      erro: erros,
      mensagem: "Erro de validação de fornecedor",
    } as Erro;
  }
}

export default validar_fornecedor;
