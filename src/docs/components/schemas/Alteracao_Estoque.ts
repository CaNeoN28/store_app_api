import { Schema } from "swagger-jsdoc";

const Alteracao_Estoque_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "number",
      obs: `ID gerado pelo banco de dados`,
    },
    quantidade_anterior: {
      type: "number",
      required: false,
      obs: `Quantidade anterior do estoque.
            Pode ser nulo.`,
    },
    quantidade_atual: {
      type: "number",
      obs: `Quantidade do estoque após alteração.
            Pode ser igual à anterior`,
    },
    estoque_id: {
      type: "number",
      obs: `ID do estoque da alteração`,
    },
    estoque: {
      $ref: "#/components/schemas/Estoque",
    },
    usuario_id: {
      type: "number",
      obs: `ID do usuario que realizou a alteração`,
    },
    usuario: {
      $ref: "#/components/schemas/Usuario",
    },
  },
};

export { Alteracao_Estoque_Schema };
