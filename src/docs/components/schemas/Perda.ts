import { Schema } from "swagger-jsdoc";

const Perda_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "number",
      obs: `ID gerado pelo banco de dados`,
    },
    data: {
      type: "Date",
      obs: `Data no qual a perda foi realizada.`,
    },
    perda_item: {
      $ref: "#/components/schema/Perda_Item",
    },
  },
};

export { Perda_Schema };
