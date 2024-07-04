export default function definir_query(
  filtros: any,
  ordenacao: any,
  selecionados: any,
  limite: number,
  pagina: number
) {
  if (isNaN(limite)) limite;
  if (isNaN(pagina)) pagina;

  return {
    where: filtros,
    orderBy: ordenacao,
    select: selecionados,
    skip: (pagina - 1) * limite,
    take: limite,
  };
}
