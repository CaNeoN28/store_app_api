import Resposta, {Erro} from "./resposta"

type Tabela =
  | "ITEM"
  | "GRUPO"
  | "USUARIO"
  | "FORNECEDOR"
  | "CLIENTE"
  | "UNIDADE"
  | "COMPRA"
  | "VENDA";

type Tabela_Prisma = "item"
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
}

interface Item {
  id?: number;
  nome: string;
  valor_atual?: number;
  desconto_porcentagem?: number;
  validade_desconto?: Date;
  unidade_id: number;
}

export { Erro, Resposta, Tabela, Tabela_Prisma, Metodo, Grupo, Item };
