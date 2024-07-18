import { Schema } from "swagger-jsdoc";
import { Unidade_Schema } from "./Unidade";
import { Acesso_Schema } from "./Acesso";

const schemas: { [k: string]: Schema } = {
  Acesso: Acesso_Schema,
  Unidade: Unidade_Schema,
};

export default schemas;
