import { Schema } from "swagger-jsdoc";
import { REGEX_EMAIL, REGEX_NOME_USUARIO, REGEX_SENHA } from "../../../utils/regex";

const Usuario_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      obs: "ID gerado pelo banco de dados.",
    },
    nome_completo: {
      type: "string",
      required: true,
      obs: "Nome completo do usuário.",
    },
    nome_usuario: {
      type: "string",
      required: true,
      unique: true,
      pattern: String(REGEX_NOME_USUARIO),
      obs: `Nome de usuário, utilizado para acesso na plataforma e identificação.`,
    },
    senha: {
      type: "string",
      required: true,
      return: false,
      pattern: String(REGEX_SENHA),
      obs: `Senha de acesso do usuário.`,
    },
    foto_url: {
      type: "string",
      required: false,
      obs: `Endereço da foto de perfil do usuário.`,
    },
    numero_telefone: {
      type: "string",
      required: false,
      obs: `Número de telefone do usuário`,
    },
    email: {
        type: "string",
        required: false,
        pattern: String(REGEX_EMAIL),
        obs: `Email pessoal do usuário.`
    }
  },
};

export { Usuario_Schema };
