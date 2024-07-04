import { Erro, Usuario } from "../../types";
import { REGEX_EMAIL, REGEX_NOME_USUARIO, REGEX_SENHA } from "../regex";

export default function validar_usuario(
  data: Usuario,
  validar_obrigatorios?: boolean | undefined
) {
  const {
    email,
    foto_url,
    grupos,
    nome_completo,
    nome_usuario,
    numero_telefone,
    senha,
  } = data;
  const erros: { [k: string]: any } = {};

  if (validar_obrigatorios && !nome_completo) {
    erros.nome_completo = "Nome completo é obrigatório";
  }

  if (validar_obrigatorios && !nome_usuario) {
    erros.nome_usuario = "Nome de usuário é obrigatório";
  } else if (nome_usuario && !REGEX_NOME_USUARIO.test(nome_usuario)) {
    erros.nome_usuario = "Nome de usuário inválido";
  }

  if (validar_obrigatorios && !senha) {
    erros.senha = "Senha é obrigatório";
  } else if (senha && !REGEX_SENHA.test(senha)) {
    erros.senha = "Senha inválida";
  }

  if (email && !REGEX_EMAIL.test(email)) {
    erros.email = "Email inválido";
  }

  if (grupos) {
    if (!Array.isArray(grupos)) {
      erros.grupos = "Deve ser uma lista";
    } else if (grupos.length > 0) {
      grupos.map((g, i) => {
        if (!g.id) {
          if (!erros.grupos) {
            erros.grupos = {};
          }

          erros.grupos[i] = "O id de um grupo é necessário";
        }
      });
    }
  }

  if (Object.keys(erros).length > 0) {
    throw {
      codigo: 400,
      erro: erros,
      mensagem: "Erro ao validar dados do usuário",
    } as Erro;
  }
}
