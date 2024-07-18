import { Schema } from "swagger-jsdoc";

const Cliente_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "number",
      obs: `ID gerado pelo banco de dados.`,
    },
    cnpj: {
      type: "string",
      required: true,
      unique: true,
      obs: `CNPJ utilizado pelo cliente.
            Não deve possuir pontuação.`,
    },
    nome: {
      type: "string",
      required: true,
      obs: `Nome de identificação do cliente`,
    },
  },
};
export { Cliente_Schema };
