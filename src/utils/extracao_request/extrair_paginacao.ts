import { Request } from "express";
import Controller from "../../controllers/Controller";

export default function extrair_paginacao(
  request: Request,
  limite_padrao = Controller.LIMITE_EXIBICAO_PADRAO,
  pagina_padrao = Controller.PAGINA_EXIBICAO_PADRAO
) {
  let limite = Number(request.query.limite),
    pagina = Number(request.query.pagina);

  if (isNaN(limite)) limite = limite_padrao;

  if (isNaN(pagina)) pagina = pagina_padrao;

  return {
    limite: limite > 0 ? limite : 1,
    pagina: pagina > 0 ? pagina : 1,
  };
}
