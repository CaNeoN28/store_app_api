import { Request } from "express";
import Controller from "../../controllers/Controller";

export default function extrair_paginacao(
  request: Request,
  limite_padrao = Controller.LIMITE_EXIBICAO_PADRAO,
  pagina_padrao = Controller.PAGINA_EXIBICAO_PADRAO,
  nome_limite = "limite",
  nome_pagina = "pagina"
) {
  const opcoes = {
    [nome_limite]: Number(request.query.limite),
    [nome_pagina]:Number(request.query.pagina)
  }

  if (isNaN(opcoes[nome_limite])) opcoes[nome_limite] = limite_padrao;

  if (isNaN(opcoes[nome_pagina])) opcoes[nome_pagina] = pagina_padrao;

  return opcoes;
}
