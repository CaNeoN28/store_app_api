import { Schema } from "swagger-jsdoc";

const Venda_Item_Schema: Schema = {
  type: "object",
  properties: {
    venda_id: {
      type: "number",
      required: true,
      return: false,
      obs: `ID da venda realizada.`,
    },
    venda: {
      $ref: "#/components/schemas/Venda",
    },
    item_id: {
      type: "number",
      required: true,
      return: false,
      obs: `ID do item da venda.`,
    },
    item: {
      $ref: "#/components/schemas/Item",
    },
    valor_combinado: {
      type: "number",
      required: true,
      obs: `Valor pelo qual o item foi vendado.
            Deve ser maior que zero.`,
    },
    quantidade: {
      type: "number",
      required: true,
      obs: `Quantidade de venda do item.
            Deve ser maior que zero.`,
    },
  },
};

export { Venda_Item_Schema };
