import { compare, genSalt, hash } from "bcrypt";

export async function comparar_senha(
  teste: string,
  senha_criptografada: string
) {
  const senha_correta = await compare(teste, senha_criptografada);

  return senha_correta;
}

export async function criptografar_senha(senha: string) {
  const salts = await genSalt(10);
  const senha_criptografada = await hash(senha, salts);

  return senha_criptografada;
}
