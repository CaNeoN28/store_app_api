import { Erro, Grupo } from "../../types";
import { METODOS, TABELAS } from "../globals";

function validar_grupo(data: Grupo, validar_obrigatorios?: boolean) {
  const erros: {
    [k: string]: any;
  } = {};

  const { nome, acessos, usuarios, id } = data;

  if (validar_obrigatorios && !nome) {
    erros.nome = "Nome do grupo é obrigatório";
  }

  if (id && isNaN(id)) {
    erros.id = "Id inválido";
  }

  if (acessos) {
    if (!Array.isArray(acessos)) {
      erros.acessos = "Acessos inválidos, deve ser uma lista";
    } else {
      const erros_acessos: {
        [k: number]: {
          tabela?: string;
          metodo?: string;
        };
      } = {};

      for (let i = 0; i < acessos.length; i++) {
        const acesso = acessos[i];

        if (!acesso.metodo) {
          erros_acessos[i] = {};
          erros_acessos[i].metodo = "Método é obrigatório";
        } else if (!METODOS.find((m) => m == acesso.metodo)) {
          erros_acessos[i] = {};
          erros_acessos[i].metodo = "Método inválido";
        }

        if (!acesso.tabela) {
          erros_acessos[i] = {};
          erros_acessos[i].tabela = "Tabela é obrigatório";
        } else if (!TABELAS.find((t) => t == acesso.tabela)) {
          if (!erros_acessos[i]) erros_acessos[i] = {};
          erros_acessos[i].tabela = "Tabela inválida";
        }
      }

      if (Object.keys(erros_acessos).length > 0) {
        erros.acessos = erros_acessos;
      }
    }
  }

  if (usuarios) {
    if (!Array.isArray(usuarios)) {
      erros.usuarios = "Usuários deve ser uma lista";
    } else if (usuarios.length > 0) {
      usuarios.map((u, i) => {
        if (!u.id) {
          if (!erros.usuario) {
            erros.usuario = {};
          }

          erros.usuario[i] = "O id de um usuário é necessário";
        }
      });
    }
  }
  if (Object.keys(erros).length > 0) {
    throw {
      codigo: 400,
      mensagem: "Erro de validação de grupo",
      erro: erros,
    } as Erro;
  }
}

export default validar_grupo;
