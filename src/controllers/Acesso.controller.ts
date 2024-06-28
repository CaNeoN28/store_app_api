import Controller from "./Controller";

class Controller_Acesso extends Controller {
  constructor() {
    super("acesso");
  }
  
  protected validar_dados(data: any, validar_obrigatorios?: boolean) {
    const erros: {
      [k: string]: string;
    } = {};

    return erros;
  }
}

export default Controller_Acesso;
