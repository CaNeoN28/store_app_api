import prisma from "./prisma";

const Tabela_Cliente = prisma.cliente;
const Tabela_Compra = prisma.compra;
const Tabela_Fornecedor = prisma.fornecedor;
const Tabela_Grupo = prisma.grupo;
const Tabela_Item = prisma.item;
const Tabela_Unidade = prisma.unidade;
const Tabela_Usuario = prisma.usuario;
const Tabela_Venda = prisma.venda;

export {
  Tabela_Cliente,
  Tabela_Compra,
  Tabela_Fornecedor,
  Tabela_Grupo,
  Tabela_Item,
  Tabela_Unidade,
  Tabela_Usuario,
  Tabela_Venda,
};
