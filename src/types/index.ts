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
  unidade_id: number;
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

export {
  Erro,
  Resposta,
  Tabela,
  Tabela_Prisma,
  Metodo,
  Grupo,
  Item,
  Usuario,
  Login,
};
