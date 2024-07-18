import { Schema } from "swagger-jsdoc";

const Unidade_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "number",
      obs: "Id padrão gerado pelo banco de dados",
    },
    nome: {
      type: "string",
      obs: `Fragmento de texto que representa a unidade de medida.
            Automaticamente convertido para letras minúsculas.`,
    },
  },
};

export { Unidade_Schema };
