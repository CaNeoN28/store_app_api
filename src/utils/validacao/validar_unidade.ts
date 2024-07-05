import { Erro, Unidade } from "../../types";

export default function validar_unidade(
  dados: Unidade,
  validar_obrigatorios?: boolean
) {
  const { nome } = dados;
  const erros: { [k: string]: any } = {};

  if (validar_obrigatorios && !nome) {
    erros.nome = "Nome da unidade é obrigatório";
  }

  if(Object.keys(erros).length > 0){
    throw {
        codigo: 400,
        erro: erros,
        mensagem: "Erro de validação de unidade"
    } as Erro
  }
}
