import { Schema } from "swagger-jsdoc";

const Perda_Item_Schema: Schema = {
  type: "object",
  properties: {
    perda_id: {
      type: "number",
      required: true,
      return: false,
      obs: `ID da perda realizada.`,
    },
    perda: {
      $ref: "#/components/schemas/Perda",
    },
    item_id: {
      type: "number",
      required: true,
      return: false,
      obs: `ID do item cujo a perda foi realizada.`,
    },
    item: {
      $ref: "#/components/schemas/Item",
    },
    quantidade: {
      type: "number",
      obs: `Quantidade do item que foi perdida.`,
    },
  },
};

export { Perda_Item_Schema };
