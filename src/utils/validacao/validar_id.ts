export default function validar_id(id: number) {
  if (isNaN(id)) {
    throw {
      codigo: 400,
      erro: "O id informado é inválido",
      mensagem: "Não foi possível recuperar o item",
    };
  }
}
