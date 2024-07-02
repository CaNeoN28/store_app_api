declare namespace Express {
  export interface Request {
    user?: {
      id: number;
      nome_usuario: string;
      grupos: {
        acessos: {
          metodo: string;
          tabela: string;
        }[];
      }[];
    };
  }
}
