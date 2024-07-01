const REGEX_EMAIL = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const REGEX_SENHA = /^(?=.*[A-Z])(?=.*[!@#$&*.])(?=.*[0-9])(?=.*[a-z]).{8,}$/;
const REGEX_NOME_USUARIO =
  /^(?=.{3,}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;

export { REGEX_EMAIL, REGEX_SENHA, REGEX_NOME_USUARIO };
