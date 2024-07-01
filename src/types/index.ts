type Tabela =
  | "ITEM"
  | "GRUPO"
  | "USUARIO"
  | "FORNECEDOR"
  | "CLIENTE"
  | "UNIDADE"
  | "COMPRA"
  | "VENDA";

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

export { Tabela, Metodo, Grupo, Item };
