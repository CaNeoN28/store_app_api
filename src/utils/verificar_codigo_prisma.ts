export default function verificar_codigo_prisma(err: any) {
  let codigo = 500;
  let erro: any = {};

  if (err.code == "P2002") {
    err.meta.target.map((e: string) => {
      erro[e] = "É único(a) e já foi utilizado(a)";
    });
    codigo = 409;
  }
  if (err.code == "P2003") {
    codigo = 400;
    erro = "As chaves estrangeiras utilizadas não pertencem a nenhum registro";
  }

  if (err.code == "P2025") {
    codigo = 404;
    erro = "A busca não corresponde a nenhum dos registros";
  }

  return {
    codigo,
    erro,
  };
}
