import { Schema } from "swagger-jsdoc";
import { Unidade_Schema } from "./Unidade";
import { Acesso_Schema } from "./Acesso";
import { Grupo_Schema } from "./Grupos";
import { Usuario_Schema } from "./Usuario";
import { Fornecedor_Schema } from "./Fornecedor";
import { Cliente_Schema } from "./Cliente";
import { Item_Schema } from "./Item";

const schemas: { [k: string]: Schema } = {
  Acesso: Acesso_Schema,
  Cliente: Cliente_Schema,
  Fornecedor: Fornecedor_Schema,
  Grupo: Grupo_Schema,
  Item: Item_Schema,
  Unidade: Unidade_Schema,
  Usuario: Usuario_Schema,
};

export default schemas;
