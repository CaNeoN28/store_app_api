import { Schema } from "swagger-jsdoc";

const Acesso_Schema: Schema = {
  type: "object",
  obs: `Acesso que é atribuído a um ou mais grupos.
        Criado automaticamente ao serem informados aos grupos.`,
  properties: {
    tabela: {
      type: "string",
      required: true,
      obs: "Corresponde a tabelas do banco de dados, e limitam o acesso de usuários a elas",
      enum: [
        "ITEM",
        "GRUPO",
        "USUARIO",
        "FORNECEDOR",
        "CLIENTE",
        "UNIDADE",
        "COMPRA",
        "VENDA",
        "ESTOQUE",
        "PERDA",
      ],
    },
    metodo: {
      type: "string",
      required: true,
      obs: "Métodos utilizados nas rotas da API, limitando o acesso dos usuários",
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
  },
};

export { Acesso_Schema };
