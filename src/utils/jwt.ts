import { Usuario } from "../types";
import * as dotenv from "dotenv";
import { sign } from "jsonwebtoken";

function gerar_token_usuario({
  nome_usuario,
  id,
}: {
  nome_usuario: string;
  id: number;
}) {
  dotenv.config();
  const { SECRET } = process.env;

  const token = sign(
    {
      nome_usuario,
      id,
    },
    SECRET || "",
    {}
  );

  return token;
}

export { gerar_token_usuario };
