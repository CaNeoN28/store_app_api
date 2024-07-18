import { Schema } from "swagger-jsdoc";

const Compra_Item_Schema: Schema = {
  type: "object",
  properties: {
    compra_id: {
      type: "number",
      required: true,
      return: false,
      obs: `ID da compra realizada.`,
    },
    compra: {
      $ref: "#/components/schemas/Compra",
    },
    item_id: {
      type: "number",
      required: true,
      return: false,
      obs: `ID do item da compra.`,
    },
    item: {
      $ref: "#/components/schemas/Compra",
    },
    valor_combinado: {
      type: "number",
      required: true,
      obs: `Valor pelo qual o item foi comprado.
            Deve ser maior que zero.`,
    },
    quantidade: {
      type: "number",
      required: true,
      obs: `Quantidade de compra do item.
            Deve ser maior que zero.`,
    },
  },
};

export { Compra_Item_Schema };
