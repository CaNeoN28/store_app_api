import { Schema } from "swagger-jsdoc";
import { Unidade_Schema } from "./Unidade";
import { Acesso_Schema } from "./Acesso";
import { Grupo_Schema } from "./Grupos";
import { Usuario_Schema } from "./Usuario";
import { Fornecedor_Schema } from "./Fornecedor";

const schemas: { [k: string]: Schema } = {
  Acesso: Acesso_Schema,
  Fornecedor: Fornecedor_Schema,
  Grupo: Grupo_Schema,
  Unidade: Unidade_Schema,
  Usuario: Usuario_Schema,
};

export default schemas;
