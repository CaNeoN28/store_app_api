export interface Erro {
  mensagem: string;
  codigo: number;
  erro: any;
}

export default interface Resposta {
  dados?: any;
  erro?: Erro;
}
