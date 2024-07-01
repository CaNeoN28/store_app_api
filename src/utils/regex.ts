const REGEX_NOME_USUARIO =
  /^(?=.{3,}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;
const REGEX_SENHA = /^(?=.*[A-Z])(?=.*[!@#$&*.])(?=.*[0-9])(?=.*[a-z]).{8,}$/;

export { REGEX_NOME_USUARIO, REGEX_SENHA };
