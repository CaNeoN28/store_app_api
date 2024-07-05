import Resposta, { Erro } from "./resposta";

type Tabela =
  | "ITEM"
  | "GRUPO"
  | "USUARIO"
  | "FORNECEDOR"
  | "CLIENTE"
  | "UNIDADE"
  | "COMPRA"
  | "VENDA";

type Tabela_Prisma =
  | "item"
  | "acesso"
  | "grupo"
  | "usuario"
  | "fornecedor"
  | "cliente"
  | "unidade"
  | "compra"
  | "venda";

type Metodo = "GET" | "PUT" | "PATCH" | "DELETE" | "POST";

interface Cliente {
  id?: number;
  cnpj: string;
  nome: string;
}

interface Compra {
  fornecedor_id: number;
  itens: {
    item_id: number;
    quantidade: number;
    valor_combinado: number;
  }[];
}

interface Grupo {
  id?: number;
  nome: string;
  acessos: [
    {
      tabela: Tabela;
      metodo: Metodo;
    }
  ];
  usuarios?: Usuario[];
}

interface Item {
  id?: number;
  nome: string;
  valor_atual?: number;
  desconto_porcentagem?: number;
  validade_desconto?: Date;
  imagem_url?: string;
  unidade_id: number;
  unidade?: Unidade;
}

interface Unidade {
  id?: number;
  nome: string;
}

interface Usuario {
  id?: number;
  nome_completo: string;
  nome_usuario: string;
  senha: string;
  foto_url: string;
  numero_telefone: string;
  email: string;

  grupos?: Grupo[];
}

interface Login {
  nome_usuario: string;
  senha: string;
}

interface Fornecedor {
  id?: number;
  cnpj: string;
  nome: string;

  compras?: [];
}

export {
  Erro,
  Resposta,
  Tabela,
  Tabela_Prisma,
  Metodo,
  Compra,
  Cliente,
  Fornecedor,
  Grupo,
  Item,
  Unidade,
  Usuario,
  Login,
};
