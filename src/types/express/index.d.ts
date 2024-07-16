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
    file_path?: string;
    file?: {
      name: string;
      mv: (path: string) => {};
    };
  }
}
