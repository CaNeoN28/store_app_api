export default interface Resposta {
  dados?: any;
  erro?: {
    mensagem: string;
    codigo: number;
    erro: any;
  };
}
