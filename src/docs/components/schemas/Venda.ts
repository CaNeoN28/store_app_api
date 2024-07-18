import { Schema } from "swagger-jsdoc";

const Venda_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "number",
      obs: `ID gerado pelo banco de dados.`,
    },
    data: {
      type: "Date",
      obs: `Data e hora no qual a venda foi realizada`,
    },
    valor_total: {
      type: "number",
      obs: `Valor total da venda.
            Gerado automaticamente ao informar os itens e suas quantidades.`,
    },
    cliente_id: {
      type: "number",
      required: false,
      return: false,
      obs: `ID do cliente para qual a venda foi realizada, se houver.`,
    },
    cliente: {
      $ref: "#/components/schemas/Fornecedor",
    },
    venda_item: {
      type: "array",
      obs: `Lista com os itens da venda.`,
      items: {
        $ref: "#/components/schemas/Venda_Item",
      },
    },
  },
};

export { Venda_Schema };
