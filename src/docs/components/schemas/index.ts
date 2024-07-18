import { Schema } from "swagger-jsdoc";
import { Unidade_Schema } from "./Unidade";

const schemas: { [k: string]: Schema } = {
  Unidade: Unidade_Schema,
};

export default schemas;
