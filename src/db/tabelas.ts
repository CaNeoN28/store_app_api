import prisma from "./prisma";

const Tabela_Acessos = prisma.acesso;
const Tabela_Alteracoes_Item = prisma.alteracao_Item;
const Tabela_Cliente = prisma.cliente;
const Tabela_Compra = prisma.compra;
const Tabela_Compra_Item = prisma.compra_Item;
const Tabela_Estoque = prisma.estoque;
const Tabela_Fornecedor = prisma.fornecedor;
const Tabela_Grupo = prisma.grupo;
const Tabela_Item = prisma.item;
const Tabela_Unidade = prisma.unidade;
const Tabela_Usuario = prisma.usuario;
const Tabela_Venda = prisma.venda;
const Tabela_Venda_Item = prisma.venda_Item;

export {
  Tabela_Acessos,
  Tabela_Alteracoes_Item,
  Tabela_Cliente,
  Tabela_Compra,
  Tabela_Compra_Item,
  Tabela_Estoque,
  Tabela_Fornecedor,
  Tabela_Grupo,
  Tabela_Item,
  Tabela_Unidade,
  Tabela_Usuario,
  Tabela_Venda,
  Tabela_Venda_Item,
};
