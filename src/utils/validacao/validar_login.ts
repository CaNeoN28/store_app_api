import { Erro, Login } from "../../types";

export default function validar_dados(data: Login): void {
    const { nome_usuario, senha } = data;
    const erros: { [k: string]: string } = {};

    if (!nome_usuario) {
      erros.nome_usuario = "Nome de usuário é obrigatório";
    }

    if (!senha) {
      erros.senha = "Senha é obrigatório";
    }

    if (Object.keys(erros).length > 0) {
      throw {
        codigo: 401,
        erro: erros,
        mensagem: "Não foi possível realizar login  ",
      } as Erro;
    }
  }