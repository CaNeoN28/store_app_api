import { Usuario } from "../types";
import * as dotenv from "dotenv";
import { sign, verify } from "jsonwebtoken";

interface Payload_Usuario {
  nome_usuario: string;
  id: number;
}

function gerar_token_usuario({ id, nome_usuario }: Payload_Usuario) {
  dotenv.config();
  const { SECRET, EXPIRES_IN } = process.env;

  const token = sign(
    {
      nome_usuario,
      id,
    },
    SECRET || "",
    {
      expiresIn: EXPIRES_IN || "12h",
    }
  );

  return token;
}

function verificar_token_usuario(token: string) {
  dotenv.config();
  const { SECRET } = process.env;

  try {
    const data = verify(token, SECRET || "") as Payload_Usuario;

    return data;
  } catch (err) {
    return undefined;
  }
}

export { gerar_token_usuario, verificar_token_usuario };
