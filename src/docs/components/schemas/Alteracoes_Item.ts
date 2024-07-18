import { Schema } from "swagger-jsdoc";

const Alteracoes_Item_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "number",
      obs: `ID gerado pelo banco de dados`,
    },
    data: {
      type: "Date",
      obs: `Horário e data da realização da alteração`,
    },
    valor_anterior: {
      type: "number",
      obs: `Valor anterior do item.
            Pode ser nulo.`,
    },
    valor_posterior: {
      type: "number",
      obs: `Valor novo do item.
            Pode ser o mesmo do anterior`,
    },
    desconto_anterior: {
      type: "number",
      obs: `Desconto anterior do item.
            Pode ser nulo.`,
    },
    desconto_posterior: {
      type: "number",
      obs: `Desconto novo do item.
            Pode ser o mesmo do anterior`,
    },
    validade_desconto: {
      type: "Date",
      obs: `Validade do desconto aplicado, se houver.`,
    },
    usuario: {
      $ref: "#/components/schemas/Usuario",
    },
    item: {
      $ref: "#/components/schemas/Item",
    },
  },
};

export { Alteracoes_Item_Schema };
