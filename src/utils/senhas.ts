import { genSalt, hash } from "bcrypt";

export async function criptografar_senha(senha: string) {
  const salts = await genSalt(10);
  const senha_criptografada = await hash(senha, salts);

  return senha_criptografada;
}
