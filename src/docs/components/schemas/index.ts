import { Schema } from "swagger-jsdoc";
import { Unidade_Schema } from "./Unidade";
import { Acesso_Schema } from "./Acesso";
import { Alteracao_Estoque_Schema } from "./Alteracao_Estoque";
import { Alteracao_Item_Schema } from "./Alteracoes_Item";
import { Cliente_Schema } from "./Cliente";
import { Compra_Item_Schema } from "./Compra_Item";
import { Compra_Schema } from "./Compra";
import { Estoque_Schema } from "./Estoque";
import { Fornecedor_Schema } from "./Fornecedor";
import { Grupo_Schema } from "./Grupos";
import { Item_Schema } from "./Item";
import { Perda_Item_Schema } from "./Perda_Item";
import { Perda_Schema } from "./Perda";
import { Usuario_Schema } from "./Usuario";
import { Venda_Item_Schema } from "./Venda_Item";
import { Venda_Schema } from "./Venda";

const schemas: { [k: string]: Schema } = {
  Acesso: Acesso_Schema,
  Alteracao_Item: Alteracao_Item_Schema,
  Alteracao_Estoque: Alteracao_Estoque_Schema,
  Cliente: Cliente_Schema,
  Compra_Item: Compra_Item_Schema,
  Compra: Compra_Schema,
  Estoque: Estoque_Schema,
  Fornecedor: Fornecedor_Schema,
  Grupo: Grupo_Schema,
  Item: Item_Schema,
  Perda_Item: Perda_Item_Schema,
  Perda: Perda_Schema,
  Unidade: Unidade_Schema,
  Usuario: Usuario_Schema,
  Venda_Item: Venda_Item_Schema,
  Venda: Venda_Schema,
};

export default schemas;
