import { Schema } from "swagger-jsdoc";

const Compra_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "number",
      obs: `ID gerado pelo banco de dados.`,
    },
    data: {
      type: "Date",
      obs: `Data e hora no qual a compra foi realizada`,
    },
    valor_total: {
      type: "number",
      obs: `Valor total da compra.
            Gerado automaticamente ao informar os itens e suas quantidades.`,
    },
    fornecedor_id: {
      type: "number",
      required: true,
      return: false,
      obs: `ID do fornecedor que deu origem a compra.`,
    },
    fornecedor: {
      $ref: "#/components/schemas/Fornecedor",
    },
    compra_item: {
      type: "array",
      obs: `Lista com os itens da compra.`,
      items: {
        $ref: "#/components/schemas/Compra_Item",
      },
    },
  },
};

export { Compra_Schema };
