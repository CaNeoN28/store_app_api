import { Schema } from "swagger-jsdoc";

const Grupo_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "id",
      obs: "ID gerado pelo banco de dados",
    },
    nome: {
      type: "string",
      required: true,
      obs: "Nome de representação no grupo",
    },
    acessos: {
      type: "array",
      obs: "Lista com os acessos permitidos a este grupo",
      items: {
        $ref: "#/components/schemas/Acesso",
      },
    },
    usuarios: {
      type: "array",
      obs: "Lista com os usuários deste grupo",
      items: {
        $ref: "#/components/schemas/Usuario",
      },
    },
  },
};

export { Grupo_Schema };
