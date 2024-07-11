import { Request } from "express";

export default function extrair_intervalo(
  request: Request,
  nome_minimo = "data_minima",
  nome_maximo = "data_maxima"
) {
  const data_maxima = request.query[nome_maximo] as string;
  const data_minima = request.query[nome_minimo] as string;

  if (data_maxima || data_minima) {
    const data_maxima_formatada = new Date(data_maxima || "");
    const data_minima_formatada = new Date(data_minima || "");

    const filtros_data: { gte?: any; lte?: any } = {};

    if (!isNaN(Number(data_maxima_formatada))) {
      filtros_data.lte = data_maxima_formatada;
    }

    if (!isNaN(Number(data_minima_formatada))) {
      filtros_data.gte = data_minima_formatada;
    }

    return filtros_data;
  }

  return;
}
