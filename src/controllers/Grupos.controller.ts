import Controller from "./Controller";

interface Grupo {
  id?: number;
  nome?: string;
}

export default class Controller_Grupos extends Controller {
  constructor() {
    super("grupo");
  }
  validar_dados(data: Grupo, validar_obrigatorios?: boolean) {
    const erros: {
      [k: string]: string;
    } = {};

    return erros;
  }
}
