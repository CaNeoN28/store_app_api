import { Schema } from "swagger-jsdoc";

const Item_Schema: Schema = {
  type: "object",
  properties: {
    id: {
      type: "number",
      obs: `ID gerado pelo banco de dados`,
    },
    nome: {
      type: "string",
      required: true,
      obs: `Nome de identificação do item.`,
    },
    valor_atual: {
      type: "number",
      required: true,
      default: 0,
      obs: `Valor do item.
            Deve ser maior ou iqual a zero.`,
    },
    desconto_porcentagem: {
      type: "number",
      required: true,
      default: true,
      obs: `Desconto atual do item.
            Deve ser maior ou igual a zero.`,
    },
    validade_desconto: {
      type: "Date",
      required: false,
      obs: `Informa o limite para o vencimento do desconto atual.`,
    },
    imagem_url: {
      type: "string",
      required: false,
      obs: `Endereço da imagem do item.`,
    },
    unidade_id: {
      type: "string",
      required: true,
      return: false,
      obs: `ID da unidade de medida do item`,
    },
    unidade: {
      type: "object",
      required: false,
      obs: `Informações a respeito da unidade do item.
            Só é utilizado na exibição de dados do item`,
      $ref: "#/components/schemas/Unidade",
    },
    estoque: {
      type: "object",
      $ref: "#/components/schemas/Estoque",
    },
    alteracoes: {
      type: "array",
      obs: `Lista com as alterações realizadas no item.
            São criadas automaticamente na alteração dos dados  `,
      items: {
        $ref: "#/components/schemas/Alteracao_Item",
      },
    },
  },
};

export { Item_Schema };
