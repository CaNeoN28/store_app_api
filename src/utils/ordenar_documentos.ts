export default function ordenar_documentos(campo: any, tabela: any) {
  const formatado = String(campo).replace("-", "");
  const descendente = String(campo).startsWith("-");
  const campos = Object.keys(tabela.fields);

  if (campos.find((c) => c == formatado)) {
    return {
      [formatado]: descendente ? "desc" : "asc",
    };
  } else {
    return {
      id: "asc"
    };
  }
}
