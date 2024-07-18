import { Schema } from "swagger-jsdoc";

const Fornecedor_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "number",
      obs: `ID gerado pelo banco de dados`,
    },
    cnpj: {
      type: "string",
      required: true,
      obs: `CNPJ utilizado pelo fornecedor.
            Não deve possuir pontuação.`,
    },
    nome: {
      type: "string",
      required: true,
      obs: `Nome de identificação do fornecedor`,
    },
  },
};

export { Fornecedor_Schema };
