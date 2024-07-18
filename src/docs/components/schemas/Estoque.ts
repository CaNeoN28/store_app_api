import { Schema } from "swagger-jsdoc";

const Estoque_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "number",
      obs: `ID gerado pelo banco de dados.`,
    },
    quantidade: {
      type: "number",
      required: true,
      default: 0,
      obs: `Quantidade do produto no estoque.
            Deve ser maior ou igual a zero.`,
    },
    item_id: {
      type: "number",
      required: true,
      return: false,
      obs: `ID do item que pertence este estoque.`,
    },
    item: {
      $ref: "#/components/schemas/Item",
    },
    alteracoes: {
      type: "array",
      obs: `Registro das alterações manuais realizadas no estoque.`,
      items: {
        $ref: "#/components/schemas/Alteracao_Estoque",
      },
    },
  },
};

export { Estoque_Schema };
