import { Request } from "express";
import Controller from "../controllers/Controller";

export default function extrair_paginacao(request: Request) {
  let limite = Number(request.query.limite),
    pagina = Number(request.query.pagina);

  if (isNaN(limite)) limite = Controller.LIMITE_EXIBICAO_PADRAO;

  if (isNaN(pagina)) pagina = Controller.PAGINA_EXIBICAO_PADRAO;

  return {
    limite,
    pagina,
  };
}
